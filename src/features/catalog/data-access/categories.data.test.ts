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
  deleteCategory,
  fetchCatalog,
  insertCategory,
  moveCategory,
  updateCategory,
} from "./categories.data";
import { CatalogApiError } from "./client";

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
  duration_minutes: 30,
  price_minor_units: 2000,
  currency_code: "USD",
  sort_order: 1,
  version: 2,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleCategory = {
  id: CAT_ID,
  name: "Hair",
  sort_order: 1,
  version: 3,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  services: [sampleService],
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

describe("catalog categories data-access", () => {
  it("fetchCatalog requests GET /v1/catalog and sorts categories and services", async () => {
    server.use(
      http.get(`${BASE_URL}/v1/catalog`, () =>
        HttpResponse.json([
          { ...sampleCategory, id: CAT_ID_2, name: "Second", sort_order: 2, services: [] },
          {
            ...sampleCategory,
            sort_order: 1,
            services: [
              { ...sampleService, sort_order: 2, name: "Second service" },
              {
                ...sampleService,
                id: "44444444-4444-4444-8444-444444444444",
                sort_order: 1,
                name: "First service",
              },
            ],
          },
        ]),
      ),
    );

    const catalog = await fetchCatalog();

    expect(catalog.map((c) => c.sort_order)).toEqual([1, 2]);
    expect(catalog[0].services.map((s) => s.sort_order)).toEqual([1, 2]);
  });

  it("insertCategory sends POST /v1/catalog/categories", async () => {
    let body: unknown = null;
    server.use(
      http.post(`${BASE_URL}/v1/catalog/categories`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(sampleCategory, { status: 201 });
      }),
    );

    const created = await insertCategory({ name: "Hair" });
    expect(body).toEqual({ name: "Hair" });
    expect(created.id).toBe(CAT_ID);
  });

  it("updateCategory sends PUT /v1/catalog/categories/:id with If-Match header", async () => {
    let ifMatch: string | null = null;
    let body: unknown = null;
    server.use(
      http.put(`${BASE_URL}/v1/catalog/categories/${CAT_ID}`, async ({ request }) => {
        ifMatch = request.headers.get("if-match");
        body = await request.json();
        return HttpResponse.json({ ...sampleCategory, version: 4 });
      }),
    );

    const updated = await updateCategory({ id: CAT_ID, version: 3, name: "VIP Hair" });

    expect(ifMatch).toBe('"v3"');
    expect(body).toEqual({ name: "VIP Hair" });
    expect(updated.version).toBe(4);
  });

  it("deleteCategory sends DELETE /v1/catalog/categories/:id with If-Match header", async () => {
    let ifMatch: string | null = null;
    server.use(
      http.delete(`${BASE_URL}/v1/catalog/categories/${CAT_ID}`, ({ request }) => {
        ifMatch = request.headers.get("if-match");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await deleteCategory({ id: CAT_ID, version: 3 });
    expect(ifMatch).toBe('"v3"');
  });

  it("moveCategory sends PUT /v1/catalog/categories/:id/placement with If-Match header", async () => {
    let ifMatch: string | null = null;
    let body: unknown = null;
    server.use(
      http.put(
        `${BASE_URL}/v1/catalog/categories/${CAT_ID}/placement`,
        async ({ request }) => {
          ifMatch = request.headers.get("if-match");
          body = await request.json();
          return HttpResponse.json({ ...sampleCategory, sort_order: 2 });
        },
      ),
    );

    const moved = await moveCategory({ id: CAT_ID, version: 3, sort_order: 2 });
    expect(ifMatch).toBe('"v3"');
    expect(body).toEqual({ sort_order: 2 });
    expect(moved.sort_order).toBe(2);
  });

  it.each([
    { status: 400, expectedCode: "VALIDATION_ERROR" },
    { status: 422, expectedCode: "VALIDATION_ERROR" },
    { status: 412, expectedCode: "STALE_VERSION" },
    { status: 428, expectedCode: "STALE_VERSION" },
    { status: 404, expectedCode: "NOT_FOUND" },
    { status: 409, expectedCode: "CONFLICT" },
    { status: 500, expectedCode: "UPSTREAM_ERROR" },
  ])(
    "maps RFC 9457 Problem Details status $status to $expectedCode",
    async ({ status, expectedCode }) => {
      server.use(
        http.get(`${BASE_URL}/v1/catalog`, () =>
          HttpResponse.json(
            {
              type: "about:blank",
              title: "Request failed",
              status,
              detail: `Failure ${status}`,
              errors:
                status === 422
                  ? { name: ["Already exists"], currency_code: "Invalid" }
                  : undefined,
            },
            {
              status,
              headers: { "content-type": "application/problem+json" },
            },
          ),
        ),
      );

      await expect(fetchCatalog()).rejects.toMatchObject({
        name: "CatalogApiError",
        code: expectedCode,
        status,
        message: `Failure ${status}`,
        fieldErrors:
          status === 422
            ? { name: ["Already exists"], currency_code: ["Invalid"] }
            : undefined,
      });
    },
  );

  it("maps network failures to UPSTREAM_ERROR", async () => {
    server.use(http.get(`${BASE_URL}/v1/catalog`, () => HttpResponse.error()));

    try {
      await fetchCatalog();
      expect.unreachable("Expected fetchCatalog to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogApiError);
      expect((error as CatalogApiError).code).toBe("UPSTREAM_ERROR");
      expect((error as CatalogApiError).status).toBe(503);
    }
  });
});
