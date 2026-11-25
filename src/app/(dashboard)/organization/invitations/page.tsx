import type { Metadata } from "next";
import { AccessDeniedCard } from "@/features/iam/components/AccessDeniedCard";
import { InvitationsWorkspace } from "@/features/iam/components/InvitationsWorkspace";
import { getInvitations, requireCurrentActor } from "@/features/iam/loaders";
import { PERMISSIONS, hasPermission } from "@/features/iam/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invitations",
};

export default async function InvitationsPage() {
  const actor = await requireCurrentActor();

  if (!hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS)) {
    return (
      <AccessDeniedCard description="You need permission to manage users in order to view or send invitations." />
    );
  }

  const invitations = await getInvitations();
  return (
    <InvitationsWorkspace
      actor={actor}
      initialInvitations={invitations}
    />
  );
}
