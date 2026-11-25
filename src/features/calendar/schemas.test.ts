import { describe, expect, it } from "vitest";
import {
  AppointmentSchema,
  CalendarPersonSchema,
  CreateAppointmentSchema,
  DeleteAppointmentSchema,
  UpdateAppointmentSchema,
} from "./schemas";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("calendar schemas", () => {
  it("parses valid CalendarPersonSchema with defaults", () => {
    const parsed = CalendarPersonSchema.parse({
      id: VALID_UUID,
      name: "Lucia Mendez",
    });
    expect(parsed.active).toBe(true);
    expect(parsed.email).toBe("");
    expect(parsed.role_label).toBe("");
  });

  it("parses valid AppointmentSchema", () => {
    const parsed = AppointmentSchema.parse({
      id: VALID_UUID,
      customer_id: VALID_UUID,
      service_id: VALID_UUID,
      person_id: VALID_UUID,
      starts_at: "2026-11-24T15:30:00.000Z",
      ends_at: "2026-11-24T16:15:00.000Z",
      status: "confirmed",
    });
    expect(parsed.channel).toBe("manual");
    expect(parsed.notes).toBe("");
    expect(parsed.status).toBe("confirmed");
  });

  it("rejects unknown appointment status", () => {
    const result = AppointmentSchema.safeParse({
      id: VALID_UUID,
      customer_id: VALID_UUID,
      service_id: VALID_UUID,
      person_id: VALID_UUID,
      starts_at: "2026-11-24T15:30:00.000Z",
      ends_at: "2026-11-24T16:15:00.000Z",
      status: "archived",
    });
    expect(result.success).toBe(false);
  });

  it("validates CreateAppointmentSchema and trims notes", () => {
    const parsed = CreateAppointmentSchema.parse({
      customer_id: VALID_UUID,
      service_id: VALID_UUID,
      person_id: VALID_UUID,
      starts_at: "2026-11-24T15:30:00.000Z",
      ends_at: "2026-11-24T16:15:00.000Z",
      notes: "  VIP client  ",
    });
    expect(parsed.notes).toBe("VIP client");
    expect(parsed.channel).toBe("manual");
  });

  it("rejects invalid UUID in CreateAppointmentSchema", () => {
    const result = CreateAppointmentSchema.safeParse({
      customer_id: "not-a-uuid",
      service_id: VALID_UUID,
      person_id: VALID_UUID,
      starts_at: "2026-11-24T15:30:00.000Z",
      ends_at: "2026-11-24T16:15:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("validates UpdateAppointmentSchema and DeleteAppointmentSchema", () => {
    const upd = UpdateAppointmentSchema.parse({
      id: VALID_UUID,
      status: "completed",
    });
    expect(upd.status).toBe("completed");

    const del = DeleteAppointmentSchema.safeParse({
      id: "not-a-uuid",
    });
    expect(del.success).toBe(false);
  });
});
