"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  CalendarApiError,
  createAppointment,
  deleteAppointment,
  updateAppointment,
  type CalendarErrorCode,
} from "./data-access";
import {
  CreateAppointmentSchema,
  DeleteAppointmentSchema,
  UpdateAppointmentSchema,
  type AppointmentDto,
  type CreateAppointmentInput,
  type DeleteAppointmentInput,
  type UpdateAppointmentInput,
} from "./schemas";

export type CalendarActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: CalendarErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function mapZodIssues(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

function toCalendarError<T>(error: unknown): CalendarActionResult<T> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid appointment input",
      fieldErrors: mapZodIssues(error),
    };
  }
  if (error instanceof CalendarApiError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  return {
    ok: false,
    code: "UPSTREAM_ERROR",
    message: "An unexpected error occurred while saving the appointment",
  };
}

export async function createAppointmentAction(
  input: CreateAppointmentInput,
): Promise<CalendarActionResult<AppointmentDto>> {
  try {
    const validated = CreateAppointmentSchema.parse(input);
    const created = await createAppointment(validated);
    revalidatePath("/calendar");
    return { ok: true, data: created };
  } catch (error) {
    return toCalendarError(error);
  }
}

export async function updateAppointmentAction(
  input: UpdateAppointmentInput,
): Promise<CalendarActionResult<AppointmentDto>> {
  try {
    const { id, ...patch } = UpdateAppointmentSchema.parse(input);
    const updated = await updateAppointment(id, patch);
    revalidatePath("/calendar");
    return { ok: true, data: updated };
  } catch (error) {
    return toCalendarError(error);
  }
}

export async function deleteAppointmentAction(
  input: DeleteAppointmentInput,
): Promise<CalendarActionResult<null>> {
  try {
    const { id } = DeleteAppointmentSchema.parse(input);
    await deleteAppointment(id);
    revalidatePath("/calendar");
    return { ok: true, data: null };
  } catch (error) {
    return toCalendarError(error);
  }
}
