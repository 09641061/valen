import "server-only";

import { z } from "zod";
import {
  CynthiaApiError,
  cynthiaFetch,
  type ApiErrorCode,
} from "@/lib/cynthia-client";
import {
  ActorSchema,
  AuthTokensSchema,
  InvitationSchema,
  RoleSchema,
  type ActorDto,
  type AuthTokensDto,
  type InvitationDto,
  type RoleDto,
} from "./schemas";

export { CynthiaApiError as IamApiError };
export type IamErrorCode = ApiErrorCode;

const ERROR_NAME = "IamApiError";

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthTokensDto> {
  const res = await cynthiaFetch(
    "/v1/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    ERROR_NAME,
    { skipAuth: true },
  );
  return AuthTokensSchema.parse(await res.json());
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthTokensDto> {
  const res = await cynthiaFetch(
    "/v1/auth/refresh",
    { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
    ERROR_NAME,
    { skipAuth: true },
  );
  return AuthTokensSchema.parse(await res.json());
}

export async function verifyInvitationToken(
  token: string,
): Promise<InvitationDto> {
  const query = new URLSearchParams({ token }).toString();
  const res = await cynthiaFetch(
    `/v1/auth/invitations/verify?${query}`,
    { method: "GET" },
    ERROR_NAME,
    { skipAuth: true },
  );
  return InvitationSchema.parse(await res.json());
}

export async function acceptInvitation(payload: {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
}): Promise<AuthTokensDto> {
  const res = await cynthiaFetch(
    "/v1/auth/invitations/accept",
    { method: "POST", body: JSON.stringify(payload) },
    ERROR_NAME,
    { skipAuth: true },
  );
  return AuthTokensSchema.parse(await res.json());
}

export async function fetchMe(): Promise<ActorDto> {
  const res = await cynthiaFetch("/v1/auth/me", { method: "GET" }, ERROR_NAME);
  return ActorSchema.parse(await res.json());
}

export async function patchMe(payload: {
  first_name: string;
  last_name: string;
  password?: string;
}): Promise<ActorDto> {
  const res = await cynthiaFetch(
    "/v1/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    ERROR_NAME,
  );
  return ActorSchema.parse(await res.json());
}

export async function logoutSession(): Promise<void> {
  await cynthiaFetch("/v1/auth/logout", { method: "POST" }, ERROR_NAME);
}

export async function fetchMembers(): Promise<ActorDto[]> {
  const res = await cynthiaFetch("/v1/iam/members", { method: "GET" }, ERROR_NAME);
  const data = z.object({ items: z.array(ActorSchema) }).parse(await res.json());
  return data.items;
}

export async function deleteMember(id: string): Promise<void> {
  await cynthiaFetch(
    `/v1/iam/members/${id}`,
    {
      method: "DELETE",
    },
    ERROR_NAME,
  );
}

export async function putMemberRoles(
  id: string,
  roleIds: string[],
): Promise<ActorDto> {
  const res = await cynthiaFetch(
    `/v1/iam/members/${id}/roles`,
    {
      method: "PUT",
      body: JSON.stringify({ role_ids: roleIds }),
    },
    ERROR_NAME,
  );
  return ActorSchema.parse(await res.json());
}

export async function fetchRoles(): Promise<RoleDto[]> {
  const res = await cynthiaFetch("/v1/iam/roles", { method: "GET" }, ERROR_NAME);
  const data = z.object({ items: z.array(RoleSchema) }).parse(await res.json());
  return data.items;
}

export async function createRole(payload: {
  name: string;
  permissions: string[];
}): Promise<RoleDto> {
  const res = await cynthiaFetch(
    "/v1/iam/roles",
    { method: "POST", body: JSON.stringify(payload) },
    ERROR_NAME,
  );
  return RoleSchema.parse(await res.json());
}

export async function patchRole(
  id: string,
  payload: { name: string; permissions: string[] },
): Promise<RoleDto> {
  const res = await cynthiaFetch(
    `/v1/iam/roles/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    ERROR_NAME,
  );
  return RoleSchema.parse(await res.json());
}

export async function deleteRole(id: string): Promise<void> {
  await cynthiaFetch(
    `/v1/iam/roles/${id}`,
    {
      method: "DELETE",
    },
    ERROR_NAME,
  );
}

export async function reorderRoles(orderedIds: string[]): Promise<RoleDto[]> {
  const res = await cynthiaFetch(
    "/v1/iam/roles/reorder",
    { method: "PUT", body: JSON.stringify({ ordered_ids: orderedIds }) },
    ERROR_NAME,
  );
  const data = z.object({ items: z.array(RoleSchema) }).parse(await res.json());
  return data.items;
}

export async function fetchInvitations(): Promise<InvitationDto[]> {
  const res = await cynthiaFetch("/v1/iam/invitations", { method: "GET" }, ERROR_NAME);
  return z.object({ items: z.array(InvitationSchema) }).parse(await res.json()).items;
}

export async function createInvitation(email: string): Promise<InvitationDto> {
  const res = await cynthiaFetch(
    "/v1/iam/invitations",
    { method: "POST", body: JSON.stringify({ email, first_name: "", last_name: "" }) },
    ERROR_NAME,
  );
  return InvitationSchema.parse(await res.json());
}

export async function deleteInvitation(id: string): Promise<void> {
  await cynthiaFetch(`/v1/iam/invitations/${id}`, { method: "DELETE" }, ERROR_NAME);
}

export async function resendInvitation(id: string): Promise<InvitationDto> {
  const res = await cynthiaFetch(`/v1/iam/invitations/${id}/resend`, { method: "POST" }, ERROR_NAME);
  return InvitationSchema.parse(await res.json());
}
