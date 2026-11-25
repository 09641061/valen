"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  IamApiError,
  createInvitation,
  createRole,
  deleteInvitation,
  deleteMember,
  deleteRole,
  patchMe,
  patchRole,
  putMemberRoles,
  reorderRoles,
  resendInvitation,
  type IamErrorCode,
} from "./data-access";
import {
  AssignRolesSchema,
  CreateInvitationSchema,
  CreateRoleSchema,
  DeleteMemberSchema,
  DeleteRoleSchema,
  ReorderRolesSchema,
  UpdateMeSchema,
  UpdateRoleSchema,
  type ActorDto,
  type AssignRolesInput,
  type CreateInvitationInput,
  type CreateRoleInput,
  type DeleteMemberInput,
  type DeleteRoleInput,
  type InvitationDto,
  type ReorderRolesInput,
  type RoleDto,
  type UpdateMeInput,
  type UpdateRoleInput,
} from "./schemas";

export type IamActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: IamErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function collectZodErrors(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const key = issue.path.join(".") || "form";
    acc[key] = [...(acc[key] ?? []), issue.message];
    return acc;
  }, {});
}

function toActionError<T>(error: unknown): IamActionResult<T> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid input",
      fieldErrors: collectZodErrors(error),
    };
  }
  if (error instanceof IamApiError) {
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
    message: "An unexpected error occurred",
  };
}

function revalidateIam(): void {
  revalidatePath("/organization/members");
  revalidatePath("/organization/roles");
  revalidatePath("/organization/invitations");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function updateMeAction(
  input: UpdateMeInput,
): Promise<IamActionResult<ActorDto>> {
  try {
    const parsed = UpdateMeSchema.parse(input);
    const payload = {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      ...(parsed.password ? { password: parsed.password } : {}),
    };
    const updated = await patchMe(payload);
    revalidateIam();
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMemberAction(
  input: DeleteMemberInput,
): Promise<IamActionResult<null>> {
  try {
    const { member_id } = DeleteMemberSchema.parse(input);
    await deleteMember(member_id);
    revalidateIam();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function assignMemberRolesAction(
  input: AssignRolesInput,
): Promise<IamActionResult<ActorDto>> {
  try {
    const { member_id, role_ids } = AssignRolesSchema.parse(input);
    const updated = await putMemberRoles(member_id, role_ids);
    revalidateIam();
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createRoleAction(
  input: CreateRoleInput,
): Promise<IamActionResult<RoleDto>> {
  try {
    const payload = CreateRoleSchema.parse(input);
    const created = await createRole(payload);
    revalidateIam();
    return { ok: true, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateRoleAction(
  input: UpdateRoleInput,
): Promise<IamActionResult<RoleDto>> {
  try {
    const { role_id, ...payload } = UpdateRoleSchema.parse(input);
    const updated = await patchRole(role_id, payload);
    revalidateIam();
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteRoleAction(
  input: DeleteRoleInput,
): Promise<IamActionResult<null>> {
  try {
    const { role_id } = DeleteRoleSchema.parse(input);
    await deleteRole(role_id);
    revalidateIam();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderRolesAction(
  input: ReorderRolesInput,
): Promise<IamActionResult<RoleDto[]>> {
  try {
    const { ordered_ids } = ReorderRolesSchema.parse(input);
    const items = await reorderRoles(ordered_ids);
    revalidateIam();
    return { ok: true, data: items };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createInvitationAction(
  input: CreateInvitationInput,
): Promise<IamActionResult<InvitationDto>> {
  try {
    const { email } = CreateInvitationSchema.parse(input);
    const created = await createInvitation(email);
    revalidateIam();
    return { ok: true, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteInvitationAction(
  id: string,
): Promise<IamActionResult<null>> {
  try {
    await deleteInvitation(id);
    revalidateIam();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resendInvitationAction(
  id: string,
): Promise<IamActionResult<InvitationDto>> {
  try {
    const updated = await resendInvitation(id);
    revalidateIam();
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}
