import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  CrmApiError,
  createCustomer,
  deleteCustomer,
  fetchConversationMessages,
  fetchConversations,
  fetchCustomers,
  updateConversationAi,
  updateCustomer,
} from "./data-access";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ CYNTHIA_API_URL: "http://cynthia.test" }),
}));

const CUSTOMER = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Jane Doe",
  phone: "+573001234567",
  version: 1,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("crm data-access", () => {
  it("fetches paginated customers with query params", async () => {
    server.use(
      http.get("http://cynthia.test/v1/customers", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("q")).toBe("jane");
        expect(url.searchParams.get("page")).toBe("2");
        return HttpResponse.json({
          items: [CUSTOMER],
          total: 25,
          page: 2,
          page_size: 20,
        });
      }),
    );

    const page = await fetchCustomers({ q: "jane", page: 2, pageSize: 20 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(25);
  });

  it("populates existingCustomer on 409 conflict when creating a customer", async () => {
    server.use(
      http.post("http://cynthia.test/v1/customers", () =>
        HttpResponse.json(
          {
            title: "Conflict",
            status: 409,
            detail: "Customer phone already exists",
            existing_customer: CUSTOMER,
          },
          {
            status: 409,
            headers: { "content-type": "application/problem+json" },
          },
        ),
      ),
    );

    await expect(
      createCustomer({ name: "Jane Duplicate", phone: "+573001234567" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      existingCustomer: CUSTOMER,
    });
  });

  it("sends If-Match header on updateCustomer and handles deleteCustomer", async () => {
    let receivedIfMatch: string | null = null;
    server.use(
      http.patch(
        `http://cynthia.test/v1/customers/${CUSTOMER.id}`,
        ({ request }) => {
          receivedIfMatch = request.headers.get("if-match");
          return HttpResponse.json({ ...CUSTOMER, version: 2 });
        },
      ),
      http.delete(
        `http://cynthia.test/v1/customers/${CUSTOMER.id}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const updated = await updateCustomer(CUSTOMER.id, 1, {
      name: "Jane Updated",
      phone: CUSTOMER.phone,
    });
    expect(receivedIfMatch).toBe('"v1"');
    expect(updated.version).toBe(2);

    await expect(deleteCustomer(CUSTOMER.id)).resolves.toBeUndefined();
  });

  it("fetches conversations and messages", async () => {
    const convId = "22222222-2222-4222-8222-222222222222";
    server.use(
      http.get("http://cynthia.test/v1/conversations", () =>
        HttpResponse.json({
          items: [
            {
              id: convId,
              customer_id: CUSTOMER.id,
              channel: "whatsapp",
              status: "open",
              version: 1,
              created_at: "2026-01-01T10:00:00Z",
              updated_at: "2026-01-01T10:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        }),
      ),
      http.get(`http://cynthia.test/v1/conversations/${convId}/messages`, () =>
        HttpResponse.json({
          items: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              conversation_id: convId,
              direction: "inbound",
              content: "Hi there",
              status: "received",
              created_at: "2026-01-01T10:01:00Z",
            },
          ],
        }),
      ),
    );

    const convs = await fetchConversations({ customerId: CUSTOMER.id });
    expect(convs.items).toHaveLength(1);
    const messages = await fetchConversationMessages(convId, 50);
    expect(messages[0].content).toBe("Hi there");
    expect(CrmApiError).toBeDefined();
  });

  it("updates conversation AI with If-Match header and body, and maps 412/409 to CrmApiError", async () => {
    const convId = "22222222-2222-4222-8222-222222222222";
    let receivedIfMatch: string | null = null;
    let receivedBody: unknown = null;

    server.use(
      http.patch(
        `http://cynthia.test/v1/conversations/${convId}/ai`,
        async ({ request }) => {
          receivedIfMatch = request.headers.get("if-match");
          receivedBody = await request.json();
          return HttpResponse.json({
            id: convId,
            customer_id: CUSTOMER.id,
            channel: "whatsapp",
            status: "open",
            ai_paused: false,
            version: 4,
            created_at: "2026-01-01T10:00:00Z",
            updated_at: "2026-01-01T10:05:00Z",
          });
        },
      ),
    );

    const updated = await updateConversationAi(convId, 3, false);
    expect(receivedIfMatch).toBe('"v3"');
    expect(receivedBody).toEqual({ ai_paused: false });
    expect(updated.ai_paused).toBe(false);
    expect(updated.version).toBe(4);

    for (const [status, code] of [
      [412, "STALE_VERSION"],
      [409, "CONFLICT"],
    ] as const) {
      server.use(
        http.patch(`http://cynthia.test/v1/conversations/${convId}/ai`, () =>
          HttpResponse.json(
            { title: code, status, detail: `Error ${status}` },
            {
              status,
              headers: { "content-type": "application/problem+json" },
            },
          ),
        ),
      );

      await expect(updateConversationAi(convId, 3, false)).rejects.toMatchObject(
        {
          name: "CrmApiError",
          code,
          status,
        },
      );
    }
  });
});
