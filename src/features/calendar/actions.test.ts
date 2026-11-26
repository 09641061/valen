import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAppointmentAction,
  deleteAppointmentAction,
  updateAppointmentAction,
} from "./actions";
import {
  CalendarApiError,
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "./data-access";

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

vi.mock("./data-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data-access")>();
  return {
    ...actual,
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
  };
});

const ID = "11111111-1111-4111-8111-111111111111";

const APPOINTMENT = {
  id: ID,
  customer_id: ID,
  customer_name: "Valeria Soto",
  customer_phone: "+525521094410",
  service_id: ID,
  service_name: "Classic haircut",
  person_id: ID,
  person_name: "Lucia Mendez",
  starts_at: "2026-11-24T14:30:00.000Z",
  ends_at: "2026-11-24T15:15:00.000Z",
  status: "confirmed" as const,
  channel: "manual",
  notes: "",
  created_at: "2026-11-24T10:00:00Z",
  updated_at: "2026-11-24T10:00:00Z",
};

describe("calendar actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns VALIDATION_ERROR for invalid create payload", async () => {
    const result = await createAppointmentAction({
      customer_id: "bad-id",
      service_id: ID,
      person_id: ID,
      starts_at: "2026-11-24T14:30:00.000Z",
      ends_at: "2026-11-24T15:15:00.000Z",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VALIDATION_ERROR");
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("creates appointment and revalidates /calendar", async () => {
    vi.mocked(createAppointment).mockResolvedValueOnce(APPOINTMENT);
    const result = await createAppointmentAction({
      customer_id: ID,
      service_id: ID,
      person_id: ID,
      starts_at: APPOINTMENT.starts_at,
      ends_at: APPOINTMENT.ends_at,
    });
    expect(result).toEqual({ ok: true, data: APPOINTMENT });
    expect(revalidatePathMock).toHaveBeenCalledWith("/calendar");
  });

  it("maps 409 conflict errors", async () => {
    vi.mocked(createAppointment).mockRejectedValueOnce(
      new CalendarApiError("CONFLICT", "Overlapping appointment", 409),
    );
    const conflict = await createAppointmentAction({
      customer_id: ID,
      service_id: ID,
      person_id: ID,
      starts_at: APPOINTMENT.starts_at,
      ends_at: APPOINTMENT.ends_at,
    });
    expect(conflict).toEqual({
      ok: false,
      code: "CONFLICT",
      message: "Overlapping appointment",
      fieldErrors: undefined,
    });
  });

  it("updates appointment and revalidates /calendar", async () => {
    const updated = { ...APPOINTMENT, status: "completed" as const };
    vi.mocked(updateAppointment).mockResolvedValueOnce(updated);
    const result = await updateAppointmentAction({
      id: ID,
      status: "completed",
    });
    expect(result).toEqual({ ok: true, data: updated });
    expect(updateAppointment).toHaveBeenCalledWith(ID, { status: "completed" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/calendar");
  });

  it("deletes appointment and revalidates /calendar", async () => {
    vi.mocked(deleteAppointment).mockResolvedValueOnce(undefined);
    const result = await deleteAppointmentAction({ id: ID });
    expect(result).toEqual({ ok: true, data: null });
    expect(deleteAppointment).toHaveBeenCalledWith(ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/calendar");
  });
});
