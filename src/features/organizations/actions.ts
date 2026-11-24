"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  OrganizationApiError,
  patchOrganization,
  type OrganizationErrorCode,
} from "./data-access";
import {
  UpdateAiInstructionsSchema,
  UpdateBusinessDetailsSchema,
  UpdateBusinessHoursSchema,
  type OrganizationDto,
  type UpdateAiInstructionsInput,
  type UpdateBusinessDetailsInput,
  type UpdateBusinessHoursInput,
} from "./schemas";

export type OrganizationActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: OrganizationErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function toActionError<T>(error: unknown): OrganizationActionResult<T> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid input",
      fieldErrors,
    };
  }
  if (error instanceof OrganizationApiError) {
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
    message: "An unexpected error occurred while saving changes",
  };
}

export async function updateBusinessDetailsAction(
  input: UpdateBusinessDetailsInput,
): Promise<OrganizationActionResult<OrganizationDto>> {
  try {
    const { version, ...payload } = UpdateBusinessDetailsSchema.parse(input);
    const updated = await patchOrganization(version, payload);
    revalidatePath("/organization");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateBusinessHoursAction(
  input: UpdateBusinessHoursInput,
): Promise<OrganizationActionResult<OrganizationDto>> {
  try {
    const { version, business_hours } = UpdateBusinessHoursSchema.parse(input);
    const updated = await patchOrganization(version, { business_hours });
    revalidatePath("/organization");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAiInstructionsAction(
  input: UpdateAiInstructionsInput,
): Promise<OrganizationActionResult<OrganizationDto>> {
  try {
    const { version, ai_instructions } =
      UpdateAiInstructionsSchema.parse(input);
    const updated = await patchOrganization(version, { ai_instructions });
    revalidatePath("/organization");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}
