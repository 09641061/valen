import "server-only";

import { z } from "zod";
import {
  CynthiaApiError,
  cynthiaFetch,
  formatIfMatchHeader,
  type ApiErrorCode,
} from "@/lib/cynthia-client";
import {
  AppointmentSchema,
  CalendarPersonSchema,
  type AppointmentDto,
  type AppointmentStatus,
  type CalendarPersonDto,
} from "./schemas";

export {
  CynthiaApiError as CalendarApiError,
  type ApiErrorCode as CalendarErrorCode,
};

const ERROR_NAME = "CalendarApiError";

export interface FetchAppointmentsParams {
  from: string;
  to: string;
  personId?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function parseList<T>(schema: z.ZodType<T>, raw: unknown): T[] {
  const payload =
    raw && typeof raw === "object" && !Array.isArray(raw) && "items" in raw
      ? (raw as { items: unknown }).items
      : raw;
  return z.array(schema).parse(payload);
}

export async function fetchCalendarPeople(): Promise<CalendarPersonDto[]> {
  const res = await cynthiaFetch("/v1/calendar/people", {}, ERROR_NAME);
  return parseList(CalendarPersonSchema, await res.json());
}

export async function fetchAppointments(
  params: FetchAppointmentsParams,
): Promise<AppointmentDto[]> {
  const query = buildQuery({
    from: params.from,
    to: params.to,
    person_id: params.personId,
  });
  const res = await cynthiaFetch(`/v1/appointments${query}`, {}, ERROR_NAME);
  return parseList(AppointmentSchema, await res.json());
}

export async function fetchAppointment(id: string): Promise<AppointmentDto> {
  const res = await cynthiaFetch(
    `/v1/appointments/${encodeURIComponent(id)}`,
    {},
    ERROR_NAME,
  );
  return AppointmentSchema.parse(await res.json());
}

export async function createAppointment(input: {
  customer_id: string;
  service_id: string;
  person_id: string;
  starts_at: string;
  ends_at: string;
  notes: string;
  channel: "manual" | "whatsapp";
}): Promise<AppointmentDto> {
  const res = await cynthiaFetch(
    "/v1/appointments",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    ERROR_NAME,
  );
  return AppointmentSchema.parse(await res.json());
}

export async function updateAppointment(
  id: string,
  version: number,
  input: {
    customer_id?: string;
    service_id?: string;
    person_id?: string;
    starts_at?: string;
    ends_at?: string;
    status?: AppointmentStatus;
    notes?: string;
  },
): Promise<AppointmentDto> {
  const res = await cynthiaFetch(
    `/v1/appointments/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "If-Match": formatIfMatchHeader(version),
      },
      body: JSON.stringify(input),
    },
    ERROR_NAME,
  );
  return AppointmentSchema.parse(await res.json());
}

export async function deleteAppointment(
  id: string,
  version: number,
): Promise<void> {
  await cynthiaFetch(
    `/v1/appointments/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        "If-Match": formatIfMatchHeader(version),
      },
    },
    ERROR_NAME,
  );
}
