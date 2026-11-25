import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import {
  IamApiError,
  fetchInvitations,
  fetchMe,
  fetchMembers,
  fetchRoles,
  verifyInvitationToken,
} from "./data-access";
import type { ActorDto, InvitationDto, RoleDto } from "./schemas";

export const getCurrentActor = cache(async (): Promise<ActorDto | null> => {
  try {
    return await fetchMe();
  } catch (error) {
    if (error instanceof IamApiError && error.code === "UNAUTHORIZED") {
      return null;
    }
    throw error;
  }
});

export async function requireCurrentActor(): Promise<ActorDto> {
  const actor = await getCurrentActor();
  if (!actor) {
    redirect("/login");
  }
  return actor;
}

export const getMembers = cache(async (): Promise<ActorDto[]> => {
  return fetchMembers();
});

export const getRoles = cache(async (): Promise<RoleDto[]> => {
  return fetchRoles();
});

export const getInvitations = cache(async (): Promise<InvitationDto[]> => {
  return fetchInvitations();
});

export async function verifyInviteOnServer(
  token: string,
): Promise<InvitationDto | null> {
  if (!token.trim()) return null;
  try {
    return await verifyInvitationToken(token);
  } catch {
    return null;
  }
}
