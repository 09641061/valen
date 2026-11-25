import { describe, expect, it } from "vitest";
import {
  BusinessHoursSchema,
  DayHoursSchema,
  OrganizationSchema,
  UpdateAiInstructionsSchema,
  UpdateBusinessDetailsSchema,
  UpdateBusinessHoursSchema,
  UpdateWhatsAppConfigSchema,
} from "./schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const openDay = { is_open: true, open_time: "09:00", close_time: "18:00" };
const closedDay = { is_open: false, open_time: "18:00", close_time: "09:00" };

const validHours = {
  monday: openDay,
  tuesday: openDay,
  wednesday: openDay,
  thursday: openDay,
  friday: openDay,
  saturday: closedDay,
  sunday: closedDay,
};

const validDetails = {
  version: 1,
  name: "Takodu Salon",
  contact_email: "hello@takodu.com",
  timezone: "America/New_York",
};

describe("organizations day and business hours schemas", () => {
  it("accepts valid open day and allows any valid HH:MM order when closed", () => {
    expect(DayHoursSchema.safeParse(openDay).success).toBe(true);
    expect(DayHoursSchema.safeParse(closedDay).success).toBe(true);
    expect(BusinessHoursSchema.safeParse(validHours).success).toBe(true);
  });

  it.each([
    { is_open: true, open_time: "18:00", close_time: "09:00" },
    { is_open: true, open_time: "09:00", close_time: "09:00" },
    { is_open: true, open_time: "24:00", close_time: "23:59" },
    { is_open: false, open_time: "9:00", close_time: "18:00" },
  ])("rejects invalid DayHours payload %j", (payload) => {
    expect(DayHoursSchema.safeParse(payload).success).toBe(false);
  });
});

describe("organizations DTO and update schemas", () => {
  it("validates OrganizationSchema DTO", () => {
    expect(
      OrganizationSchema.safeParse({
        id: ORG_ID,
        name: "Takodu",
        business_type: "Salon",
        contact_email: "",
        timezone: "UTC",
        business_hours: validHours,
        ai_instructions: "",
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }).success,
    ).toBe(true);

    expect(
      OrganizationSchema.safeParse({
        id: "not-a-uuid",
        name: "Takodu",
        business_type: "Salon",
        contact_email: "",
        timezone: "UTC",
        business_hours: validHours,
        ai_instructions: "",
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }).success,
    ).toBe(false);
  });

  it("trims and accepts UpdateBusinessDetailsSchema boundaries", () => {
    const parsed = UpdateBusinessDetailsSchema.safeParse({
      version: 1,
      name: "  Ab  ",
      contact_email: " a@b.co ",
      timezone: " UTC ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ab");
      expect(parsed.data.contact_email).toBe("a@b.co");
      expect(parsed.data.timezone).toBe("UTC");
    }

    expect(
      UpdateBusinessDetailsSchema.safeParse({
        ...validDetails,
        name: "x".repeat(120),
      }).success,
    ).toBe(true);
  });

  it.each([
    { version: 0 },
    { name: "   " },
    { name: "A" },
    { name: "x".repeat(121) },
    { contact_email: "" },
    { contact_email: "a@b" },
    { contact_email: "not-an-email" },
    { contact_email: `${"a".repeat(245)}@example.com` },
    { timezone: "   " },
  ])("rejects invalid UpdateBusinessDetailsSchema override %j", (override) => {
    expect(
      UpdateBusinessDetailsSchema.safeParse({ ...validDetails, ...override })
        .success,
    ).toBe(false);
  });

  it("validates UpdateBusinessHoursSchema and UpdateAiInstructionsSchema boundaries", () => {
    expect(
      UpdateBusinessHoursSchema.safeParse({
        version: 2,
        business_hours: validHours,
      }).success,
    ).toBe(true);
    expect(
      UpdateBusinessHoursSchema.safeParse({
        version: 0,
        business_hours: validHours,
      }).success,
    ).toBe(false);

    expect(
      UpdateAiInstructionsSchema.safeParse({
        version: 1,
        ai_instructions: "a".repeat(4000),
      }).success,
    ).toBe(true);
    expect(
      UpdateAiInstructionsSchema.safeParse({
        version: 1,
        ai_instructions: "a".repeat(4001),
      }).success,
    ).toBe(false);
  });

  it("validates UpdateWhatsAppConfigSchema rules and normalization", () => {
    const enabled = UpdateWhatsAppConfigSchema.safeParse({
      version: 1,
      whatsapp_enabled: true,
      whatsapp_phone_number: " +51 994-356-103 ",
      whatsapp_phone_number_id: " 106540352242922 ",
    });
    expect(enabled.success).toBe(true);
    if (enabled.success) {
      expect(enabled.data.whatsapp_phone_number).toBe("+51994356103");
      expect(enabled.data.whatsapp_phone_number_id).toBe("106540352242922");
    }

    expect(
      UpdateWhatsAppConfigSchema.safeParse({
        version: 1,
        whatsapp_enabled: false,
        whatsapp_phone_number: "",
        whatsapp_phone_number_id: "",
      }).success,
    ).toBe(true);

    const invalidCases = [
      { whatsapp_enabled: true, whatsapp_phone_number: "", whatsapp_phone_number_id: "123" },
      { whatsapp_enabled: true, whatsapp_phone_number: "+51994356103", whatsapp_phone_number_id: "" },
      { whatsapp_enabled: false, whatsapp_phone_number: "51994356103", whatsapp_phone_number_id: "" },
      { whatsapp_enabled: false, whatsapp_phone_number: "", whatsapp_phone_number_id: "abc123" },
      { whatsapp_enabled: false, whatsapp_phone_number: "", whatsapp_phone_number_id: "1".repeat(65) },
    ];
    for (const payload of invalidCases) {
      expect(
        UpdateWhatsAppConfigSchema.safeParse({ version: 1, ...payload }).success,
      ).toBe(false);
    }
  });
});
