import { describe, expect, it } from "vitest";
import {
  CategorySchema,
  CreateCategorySchema,
  CreateServiceSchema,
  DeleteCategorySchema,
  DeleteServiceSchema,
  MoveCategorySchema,
  MoveServiceSchema,
  ServiceSchema,
  UpdateCategorySchema,
  UpdateServiceSchema,
} from "./schemas";

const CAT_ID = "11111111-1111-4111-8111-111111111111";
const SVC_ID = "22222222-2222-4222-8222-222222222222";

const validServiceDto = {
  id: SVC_ID,
  category_id: CAT_ID,
  name: "Classic haircut",
  duration_minutes: 45,
  price_minor_units: 2500,
  currency_code: "USD",
  sort_order: 1,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const validCreateService = {
  category_id: CAT_ID,
  name: "Haircut",
  duration_minutes: 30,
  price_minor_units: 1000,
  currency_code: "USD",
};

describe("catalog category schemas", () => {
  it("accepts and trims valid category names at boundaries (1 and 120 chars)", () => {
    const min = CreateCategorySchema.safeParse({ name: "  A  " });
    expect(min.success).toBe(true);
    if (min.success) expect(min.data.name).toBe("A");

    expect(
      CreateCategorySchema.safeParse({ name: "x".repeat(120) }).success,
    ).toBe(true);
  });

  it.each(["", "   ", "x".repeat(121)])(
    "rejects invalid category name %j",
    (name) => {
      expect(CreateCategorySchema.safeParse({ name }).success).toBe(false);
    },
  );

  it.each([
    { schema: UpdateCategorySchema, payload: { id: CAT_ID, version: 1, name: "Hair" }, valid: true },
    { schema: UpdateCategorySchema, payload: { id: "bad", version: 1, name: "Hair" }, valid: false },
    { schema: UpdateCategorySchema, payload: { id: CAT_ID, version: 0, name: "Hair" }, valid: false },
    { schema: DeleteCategorySchema, payload: { id: CAT_ID, version: 2 }, valid: true },
    { schema: DeleteCategorySchema, payload: { id: "bad", version: 2 }, valid: false },
    { schema: DeleteCategorySchema, payload: { id: CAT_ID, version: 0 }, valid: false },
    { schema: MoveCategorySchema, payload: { id: CAT_ID, version: 1, sort_order: 1 }, valid: true },
    { schema: MoveCategorySchema, payload: { id: CAT_ID, version: 1, sort_order: 0 }, valid: false },
    { schema: MoveCategorySchema, payload: { id: CAT_ID, version: 1, sort_order: 1.5 }, valid: false },
  ])("validates category mutation schema case %#", ({ schema, payload, valid }) => {
    expect(schema.safeParse(payload).success).toBe(valid);
  });

  it("validates CategorySchema with nested services", () => {
    expect(
      CategorySchema.safeParse({
        id: CAT_ID,
        name: "Hair",
        sort_order: 1,
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        services: [validServiceDto],
      }).success,
    ).toBe(true);
  });
});

describe("catalog service schemas", () => {
  it("accepts valid CreateServiceSchema payloads and boundary values", () => {
    const min = CreateServiceSchema.safeParse({
      ...validCreateService,
      duration_minutes: 1,
      price_minor_units: 0,
      currency_code: "usd",
    });
    expect(min.success).toBe(true);
    if (min.success) expect(min.data.currency_code).toBe("USD");

    expect(
      CreateServiceSchema.safeParse({
        ...validCreateService,
        name: "S".repeat(120),
        duration_minutes: 1440,
        price_minor_units: 999_999,
        currency_code: "COP",
        sort_order: 1,
      }).success,
    ).toBe(true);
  });

  it.each([
    { name: "   " },
    { name: "a".repeat(121) },
    { duration_minutes: 0 },
    { duration_minutes: -10 },
    { duration_minutes: 1441 },
    { duration_minutes: 30.5 },
    { price_minor_units: -1 },
    { price_minor_units: -100 },
    { price_minor_units: 12.5 },
    { currency_code: "US" },
    { currency_code: "USDD" },
    { currency_code: "12A" },
    { currency_code: "" },
    { category_id: "invalid-uuid" },
    { sort_order: 0 },
  ])("rejects invalid CreateServiceSchema override %j", (override) => {
    expect(
      CreateServiceSchema.safeParse({ ...validCreateService, ...override })
        .success,
    ).toBe(false);
  });

  it("rejects lowercase currency_code in ServiceSchema DTO", () => {
    expect(
      ServiceSchema.safeParse({ ...validServiceDto, currency_code: "usd" })
        .success,
    ).toBe(false);
    expect(ServiceSchema.safeParse(validServiceDto).success).toBe(true);
  });

  it.each([
    {
      schema: UpdateServiceSchema,
      payload: {
        id: SVC_ID,
        version: 2,
        name: "Premium haircut",
        duration_minutes: 60,
        price_minor_units: 3500,
        currency_code: "EUR",
      },
      valid: true,
    },
    {
      schema: UpdateServiceSchema,
      payload: {
        id: "invalid",
        version: 2,
        name: "Premium haircut",
        duration_minutes: 60,
        price_minor_units: 3500,
        currency_code: "EUR",
      },
      valid: false,
    },
    { schema: DeleteServiceSchema, payload: { id: SVC_ID, version: 0 }, valid: false },
    { schema: DeleteServiceSchema, payload: { id: SVC_ID, version: 1 }, valid: true },
    { schema: MoveServiceSchema, payload: { id: SVC_ID, version: 1, category_id: "bad", sort_order: 1 }, valid: false },
    { schema: MoveServiceSchema, payload: { id: SVC_ID, version: 1, category_id: CAT_ID, sort_order: 0 }, valid: false },
    { schema: MoveServiceSchema, payload: { id: SVC_ID, version: 1, category_id: CAT_ID, sort_order: 2 }, valid: true },
  ])("validates service mutation schema case %#", ({ schema, payload, valid }) => {
    expect(schema.safeParse(payload).success).toBe(valid);
  });
});
