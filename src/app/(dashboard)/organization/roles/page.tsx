import type { Metadata } from "next";
import { AccessDeniedCard } from "@/features/iam/components/AccessDeniedCard";
import { RolesWorkspace } from "@/features/iam/components/RolesWorkspace";
import { getRoles, requireCurrentActor } from "@/features/iam/loaders";
import { PERMISSIONS, hasPermission } from "@/features/iam/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roles and permissions",
};

export default async function RolesPage() {
  const actor = await requireCurrentActor();

  const canView =
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES) ||
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS);

  if (!canView) {
    return (
      <AccessDeniedCard description="You need permission to manage roles or users in order to view permission groups." />
    );
  }

  const roles = await getRoles();
  return <RolesWorkspace actor={actor} initialRoles={roles} />;
}
