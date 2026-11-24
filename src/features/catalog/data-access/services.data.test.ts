import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getServerEnv } from "@/lib/env";
import {
  deleteService,
  insertService,
  moveService,
  updateService,
} from "./services.data";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(),
}));

const BASE_URL = "http://cynthia.test";
const CAT_ID = "11111111-1111-4111-8111-111111111111";
const CAT_ID_2 = "33333333-3333-4333-8333-333333333333";
const SVC_ID = "22222222-2222-4222-8222-222222222222";

const sampleService = {
  id: SVC_ID,
  category_id: CAT_ID,
  name: "Classic haircut",
  description: "Includes wash",
  duration_minutes: 30,
  price_minor_units: 2000,
  currency_code: "USD",
  sort_order: 1,
  version: 2,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  vi.mocked(getServerEnv).mockReturnValue({
    CYNTHIA_API_URL: BASE_URL,
  });
});

describe("catalog services data-access", () => {
  it("insertService sends POST /v1/catalog/categories/:categoryId/services", async () => {
    let body: unknown = null;
    server.use(
      http.post(
        `${BASE_URL}/v1/catalog/categories/${CAT_ID}/services`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(sampleService, { status: 201 });
        },
      ),
    );

    const created = await insertService({
      category_id: CAT_ID,
      name: "Classic haircut",
      description: "Includes wash",
      duration_minutes: 30,
      price_minor_units: 2000,
      currency_code: "USD",
      sort_order: 1,
    });

    expect(body).toEqual({
      name: "Classic haircut",
      description: "Includes wash",
      duration_minutes: 30,
      price_minor_units: 2000,
      currency_code: "USD",
      sort_order: 1,
    });
    expect(created.id).toBe(SVC_ID);
  });

  it("updateService sends PUT /v1/catalog/services/:id with If-Match header", async () => {
    let ifMatch: string | null = null;
    server.use(
      http.put(`${BASE_URL}/v1/catalog/services/${SVC_ID}`, ({ request }) => {
        ifMatch = request.headers.get("if-match");
        return HttpResponse.json({ ...sampleService, version: 3 });
      }),
    );

    const updated = await updateService({
      id: SVC_ID,
      version: 2,
      name: "Updated haircut",
      description: "",
      duration_minutes: 45,
      price_minor_units: 2500,
      currency_code: "USD",
    });

    expect(ifMatch).toBe('"v2"');
    expect(updated.version).toBe(3);
  });

  it("deleteService sends DELETE /v1/catalog/services/:id with If-Match header", async () => {
    let ifMatch: string | null = null;
    server.use(
      http.delete(`${BASE_URL}/v1/catalog/services/${SVC_ID}`, ({ request }) => {
        ifMatch = request.headers.get("if-match");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await deleteService({ id: SVC_ID, version: 2 });
    expect(ifMatch).toBe('"v2"');
  });

  it("moveService sends PUT /v1/catalog/services/:id/placement with If-Match header", async () => {
    let ifMatch: string | null = null;
    let body: unknown = null;
    server.use(
      http.put(
        `${BASE_URL}/v1/catalog/services/${SVC_ID}/placement`,
        async ({ request }) => {
          ifMatch = request.headers.get("if-match");
          body = await request.json();
          return HttpResponse.json({
            ...sampleService,
            category_id: CAT_ID_2,
            sort_order: 1,
          });
        },
      ),
    );

    const moved = await moveService({
      id: SVC_ID,
      version: 2,
      category_id: CAT_ID_2,
      sort_order: 1,
    });

    expect(ifMatch).toBe('"v2"');
    expect(body).toEqual({ category_id: CAT_ID_2, sort_order: 1 });
    expect(moved.category_id).toBe(CAT_ID_2);
  });
});
