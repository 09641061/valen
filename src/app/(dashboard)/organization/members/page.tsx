import type { Metadata } from "next";
import { AccessDeniedCard } from "@/features/iam/components/AccessDeniedCard";
import { MembersWorkspace } from "@/features/iam/components/MembersWorkspace";
import { getMembers, requireCurrentActor } from "@/features/iam/loaders";
import { PERMISSIONS, hasPermission } from "@/features/iam/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Members",
};

export default async function MembersPage() {
  const actor = await requireCurrentActor();

  const canView =
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS) ||
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES);

  if (!canView) {
    return (
      <AccessDeniedCard description="You need permission to manage users or roles in order to view workspace members." />
    );
  }

  const members = await getMembers();
  return <MembersWorkspace actor={actor} initialMembers={members} />;
}
