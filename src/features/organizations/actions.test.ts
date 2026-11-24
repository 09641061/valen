import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  updateAiInstructionsAction,
  updateBusinessDetailsAction,
  updateBusinessHoursAction,
} from "./actions";
import * as dataAccess from "./data-access";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./data-access", async () => {
  class OrganizationApiError extends Error {
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
      this.name = "OrganizationApiError";
      this.code = code;
      this.status = status;
      this.fieldErrors = fieldErrors;
    }
  }

  return {
    OrganizationApiError,
    patchOrganization: vi.fn(),
  };
});

const openDay = { is_open: true, open_time: "09:00", close_time: "18:00" };
const validHours = {
  monday: openDay,
  tuesday: openDay,
  wednesday: openDay,
  thursday: openDay,
  friday: openDay,
  saturday: { is_open: false, open_time: "09:00", close_time: "18:00" },
  sunday: { is_open: false, open_time: "09:00", close_time: "18:00" },
};

const sampleOrganization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Takodu",
  business_type: "Salon",
  contact_email: "hello@takodu.com",
  timezone: "UTC",
  business_hours: validHours,
  ai_instructions: "Be concise.",
  version: 2,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("organizations server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid inputs via Zod without calling patchOrganization or revalidatePath", async () => {
    const results = await Promise.all([
      updateBusinessDetailsAction({
        version: 1,
        name: "   ",
        contact_email: "bad-email",
        timezone: "UTC",
      }),
      updateBusinessHoursAction({
        version: 1,
        business_hours: {
          ...validHours,
          monday: { is_open: true, open_time: "18:00", close_time: "09:00" },
        },
      }),
      updateAiInstructionsAction({
        version: 1,
        ai_instructions: "a".repeat(4001),
      }),
    ]);

    for (const res of results) {
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.code).toBe("VALIDATION_ERROR");
    }

    expect(dataAccess.patchOrganization).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("executes all 3 actions and revalidates /organization on success", async () => {
    vi.mocked(dataAccess.patchOrganization).mockResolvedValue(
      sampleOrganization,
    );

    expect(
      await updateBusinessDetailsAction({
        version: 1,
        name: "  Takodu  ",
        contact_email: "hello@takodu.com",
        timezone: "UTC",
      }),
    ).toEqual({ ok: true, data: sampleOrganization });

    expect(
      await updateBusinessHoursAction({
        version: 1,
        business_hours: validHours,
      }),
    ).toEqual({ ok: true, data: sampleOrganization });

    expect(
      await updateAiInstructionsAction({
        version: 1,
        ai_instructions: "Be concise.",
      }),
    ).toEqual({ ok: true, data: sampleOrganization });

    expect(dataAccess.patchOrganization).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenCalledWith("/organization");
  });

  it("maps OrganizationApiError and unexpected errors without revalidating", async () => {
    vi.mocked(dataAccess.patchOrganization).mockRejectedValueOnce(
      new dataAccess.OrganizationApiError(
        "STALE_VERSION",
        "Version conflict",
        412,
      ),
    );
    expect(
      await updateAiInstructionsAction({ version: 1, ai_instructions: "Hi" }),
    ).toEqual({
      ok: false,
      code: "STALE_VERSION",
      message: "Version conflict",
      fieldErrors: undefined,
    });

    vi.mocked(dataAccess.patchOrganization).mockRejectedValueOnce(
      new Error("network down"),
    );
    expect(
      await updateAiInstructionsAction({ version: 1, ai_instructions: "Hi" }),
    ).toEqual({
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "An unexpected error occurred while saving changes",
    });

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
