import { describe, expect, it } from "vitest";
import {
  applyOptimisticCategoryMove,
  applyOptimisticServiceMove,
  formatDuration,
  formatMinorUnitsToInput,
  formatPrice,
  parsePriceToMinorUnits,
} from "./format";
import type { CategoryDto, ServiceDto } from "./schemas";

function makeService(
  id: string,
  categoryId: string,
  sortOrder: number,
): ServiceDto {
  return {
    id,
    category_id: categoryId,
    name: `Service ${id}`,
    duration_minutes: 30,
    price_minor_units: 1500,
    sort_order: sortOrder,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function makeCategory(
  id: string,
  sortOrder: number,
  services: ServiceDto[] = [],
): CategoryDto {
  return {
    id,
    name: `Category ${id}`,
    sort_order: sortOrder,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    services,
  };
}

describe("catalog formatting helpers", () => {
  it("formats minor units into currency strings and falls back on invalid currency codes", () => {
    const usd = formatPrice(2550, "USD");
    expect(usd).toBe("$25.50");

    const fallback = formatPrice(2550, "INVALID_CODE");
    expect(fallback).toBe("25.50 INVALID_CODE");
  });

  it("parses valid decimal price strings and rejects malformed inputs", () => {
    expect(parsePriceToMinorUnits("25.50")).toBe(2550);
    expect(parsePriceToMinorUnits("25,50")).toBe(2550);
    expect(parsePriceToMinorUnits(" 10 ")).toBe(1000);
    expect(parsePriceToMinorUnits("0")).toBe(0);
    expect(parsePriceToMinorUnits("12.5")).toBe(1250);

    expect(parsePriceToMinorUnits("")).toBeNull();
    expect(parsePriceToMinorUnits("-5.00")).toBeNull();
    expect(parsePriceToMinorUnits("abc")).toBeNull();
    expect(parsePriceToMinorUnits("12.345")).toBeNull();
    expect(parsePriceToMinorUnits("12.3.4")).toBeNull();
  });

  it("formats minor units to decimal input string", () => {
    expect(formatMinorUnitsToInput(0)).toBe("0.00");
    expect(formatMinorUnitsToInput(2550)).toBe("25.50");
  });

  it("formats durations under 1h, exact hours, and hours with minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(120)).toBe("2 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});

describe("optimistic reorder helpers", () => {
  it("reorders categories while preserving UUIDs and consecutive 1..n sort_order", () => {
    const c1 = "11111111-1111-4111-8111-111111111111";
    const c2 = "22222222-2222-4222-8222-222222222222";
    const c3 = "33333333-3333-4333-8333-333333333333";

    const initial = [
      makeCategory(c1, 1),
      makeCategory(c2, 2),
      makeCategory(c3, 3),
    ];

    const movedForward = applyOptimisticCategoryMove(initial, c1, 3);
    expect(movedForward.map((c) => c.id)).toEqual([c2, c3, c1]);
    expect(movedForward.map((c) => c.sort_order)).toEqual([1, 2, 3]);

    const movedBackward = applyOptimisticCategoryMove(movedForward, c1, 1);
    expect(movedBackward.map((c) => c.id)).toEqual([c1, c2, c3]);
    expect(movedBackward.map((c) => c.sort_order)).toEqual([1, 2, 3]);

    const unchanged = applyOptimisticCategoryMove(initial, "unknown-id", 1);
    expect(unchanged).toBe(initial);
  });

  it("reorders services within the same category with consecutive 1..n sort_order", () => {
    const c1 = "11111111-1111-4111-8111-111111111111";
    const s1 = "aaaa1111-1111-4111-8111-111111111111";
    const s2 = "aaaa2222-2222-4222-8222-222222222222";
    const s3 = "aaaa3333-3333-4333-8333-333333333333";

    const initial = [
      makeCategory(c1, 1, [
        makeService(s1, c1, 1),
        makeService(s2, c1, 2),
        makeService(s3, c1, 3),
      ]),
    ];

    const updated = applyOptimisticServiceMove(initial, s3, c1, 1);
    expect(updated[0].services.map((s) => s.id)).toEqual([s3, s1, s2]);
    expect(updated[0].services.map((s) => s.sort_order)).toEqual([1, 2, 3]);
    expect(updated[0].services.every((s) => s.category_id === c1)).toBe(true);
  });

  it("moves a service across categories and renumbers both source and destination", () => {
    const c1 = "11111111-1111-4111-8111-111111111111";
    const c2 = "22222222-2222-4222-8222-222222222222";
    const s1 = "aaaa1111-1111-4111-8111-111111111111";
    const s2 = "aaaa2222-2222-4222-8222-222222222222";
    const s3 = "bbbb3333-3333-4333-8333-333333333333";

    const initial = [
      makeCategory(c1, 1, [makeService(s1, c1, 1), makeService(s2, c1, 2)]),
      makeCategory(c2, 2, [makeService(s3, c2, 1)]),
    ];

    const updated = applyOptimisticServiceMove(initial, s1, c2, 1);

    expect(updated[0].services.map((s) => s.id)).toEqual([s2]);
    expect(updated[0].services.map((s) => s.sort_order)).toEqual([1]);

    expect(updated[1].services.map((s) => s.id)).toEqual([s1, s3]);
    expect(updated[1].services.map((s) => s.sort_order)).toEqual([1, 2]);
    expect(updated[1].services.every((s) => s.category_id === c2)).toBe(true);

    expect(applyOptimisticServiceMove(initial, "missing", c2, 1)).toBe(initial);
    expect(applyOptimisticServiceMove(initial, s1, "missing", 1)).toBe(initial);
  });
});
