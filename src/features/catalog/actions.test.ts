import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCategoryAction,
  createServiceAction,
  deleteCategoryAction,
  deleteServiceAction,
  moveCategoryAction,
  moveServiceAction,
  updateCategoryAction,
  updateServiceAction,
} from "./actions";
import * as dataAccess from "./data-access";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./data-access", async () => {
  class CatalogApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly fieldErrors?: Record<string, string[]>;

    constructor(
      code: string,
      message: string,
      status: number,
      fieldErrors?: Record<string, string[]>,
    ) {
      super(message);
      this.name = "CatalogApiError";
      this.code = code;
      this.status = status;
      this.fieldErrors = fieldErrors;
    }
  }

  return {
    CatalogApiError,
    insertCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    moveCategory: vi.fn(),
    insertService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
    moveService: vi.fn(),
  };
});

const CAT_ID = "11111111-1111-4111-8111-111111111111";
const SVC_ID = "22222222-2222-4222-8222-222222222222";

const sampleCategory = {
  id: CAT_ID,
  name: "Hair",
  sort_order: 1,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  services: [],
};

const sampleService = {
  id: SVC_ID,
  category_id: CAT_ID,
  name: "Haircut",
  duration_minutes: 30,
  price_minor_units: 2000,
  sort_order: 1,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("catalog server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid inputs via Zod without calling data-access or revalidatePath", async () => {
    const results = await Promise.all([
      createCategoryAction({ name: "   " }),
      updateCategoryAction({ id: "bad", version: 1, name: "Hair" }),
      deleteCategoryAction({ id: CAT_ID, version: 0 }),
      moveCategoryAction({ id: CAT_ID, version: 1, sort_order: 0 }),
      createServiceAction({
        category_id: CAT_ID,
        name: "Haircut",
        duration_minutes: 0,
        price_minor_units: 1000,
      }),
      updateServiceAction({
        id: SVC_ID,
        version: 1,
        name: "Haircut",
        duration_minutes: 30,
        price_minor_units: -1,
      }),
      deleteServiceAction({ id: "bad", version: 1 }),
      moveServiceAction({
        id: SVC_ID,
        version: 1,
        category_id: "bad",
        sort_order: 1,
      }),
    ]);

    for (const res of results) {
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.code).toBe("VALIDATION_ERROR");
    }

    expect(dataAccess.insertCategory).not.toHaveBeenCalled();
    expect(dataAccess.updateCategory).not.toHaveBeenCalled();
    expect(dataAccess.deleteCategory).not.toHaveBeenCalled();
    expect(dataAccess.moveCategory).not.toHaveBeenCalled();
    expect(dataAccess.insertService).not.toHaveBeenCalled();
    expect(dataAccess.updateService).not.toHaveBeenCalled();
    expect(dataAccess.deleteService).not.toHaveBeenCalled();
    expect(dataAccess.moveService).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("executes all 8 actions and revalidates /catalog on success", async () => {
    vi.mocked(dataAccess.insertCategory).mockResolvedValue(sampleCategory);
    vi.mocked(dataAccess.updateCategory).mockResolvedValue(sampleCategory);
    vi.mocked(dataAccess.deleteCategory).mockResolvedValue(undefined);
    vi.mocked(dataAccess.moveCategory).mockResolvedValue(sampleCategory);
    vi.mocked(dataAccess.insertService).mockResolvedValue(sampleService);
    vi.mocked(dataAccess.updateService).mockResolvedValue(sampleService);
    vi.mocked(dataAccess.deleteService).mockResolvedValue(undefined);
    vi.mocked(dataAccess.moveService).mockResolvedValue(sampleService);

    expect(await createCategoryAction({ name: "Hair" })).toEqual({
      ok: true,
      data: sampleCategory,
    });
    expect(
      await updateCategoryAction({ id: CAT_ID, version: 1, name: "Hair" }),
    ).toEqual({ ok: true, data: sampleCategory });
    expect(await deleteCategoryAction({ id: CAT_ID, version: 1 })).toEqual({
      ok: true,
      data: null,
    });
    expect(
      await moveCategoryAction({ id: CAT_ID, version: 1, sort_order: 1 }),
    ).toEqual({ ok: true, data: sampleCategory });
    expect(
      await createServiceAction({
        category_id: CAT_ID,
        name: "Haircut",
        duration_minutes: 30,
        price_minor_units: 2000,
      }),
    ).toEqual({ ok: true, data: sampleService });
    expect(
      await updateServiceAction({
        id: SVC_ID,
        version: 1,
        name: "Haircut",
        duration_minutes: 30,
        price_minor_units: 2000,
      }),
    ).toEqual({ ok: true, data: sampleService });
    expect(await deleteServiceAction({ id: SVC_ID, version: 1 })).toEqual({
      ok: true,
      data: null,
    });
    expect(
      await moveServiceAction({
        id: SVC_ID,
        version: 1,
        category_id: CAT_ID,
        sort_order: 1,
      }),
    ).toEqual({ ok: true, data: sampleService });

    expect(revalidatePath).toHaveBeenCalledTimes(8);
    expect(revalidatePath).toHaveBeenCalledWith("/catalog");
  });

  it("maps STALE_VERSION and CONFLICT CatalogApiError codes cleanly", async () => {
    vi.mocked(dataAccess.updateCategory).mockRejectedValueOnce(
      new dataAccess.CatalogApiError("STALE_VERSION", "Version mismatch", 412),
    );
    expect(
      await updateCategoryAction({ id: CAT_ID, version: 1, name: "Hair" }),
    ).toEqual({
      ok: false,
      code: "STALE_VERSION",
      message: "Version mismatch",
      fieldErrors: undefined,
    });
    expect(revalidatePath).not.toHaveBeenCalled();

    vi.mocked(dataAccess.insertCategory).mockRejectedValueOnce(
      new dataAccess.CatalogApiError("CONFLICT", "Duplicate name", 409, {
        name: ["A category with that name already exists"],
      }),
    );
    expect(await createCategoryAction({ name: "Hair" })).toEqual({
      ok: false,
      code: "CONFLICT",
      message: "Duplicate name",
      fieldErrors: { name: ["A category with that name already exists"] },
    });
  });

  it("maps unexpected non-CatalogApiError errors to UPSTREAM_ERROR", async () => {
    vi.mocked(dataAccess.deleteService).mockRejectedValueOnce(new Error("boom"));

    expect(await deleteServiceAction({ id: SVC_ID, version: 1 })).toEqual({
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "An unexpected error occurred while processing the request",
    });
  });
});
