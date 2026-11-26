import type { Metadata } from "next";
import { AccessDeniedCard } from "@/features/iam/components/AccessDeniedCard";
import { requireCurrentActor } from "@/features/iam/loaders";
import { PERMISSIONS, hasPermission } from "@/features/iam/permissions";
import { OrganizationProfileWorkspace } from "@/features/organizations/components/OrganizationProfileWorkspace";
import { getOrganization } from "@/features/organizations/loaders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business profile",
};

export default async function OrganizationPage() {
  const actor = await requireCurrentActor();

  if (!hasPermission(actor, PERMISSIONS.ORGANIZATION_MANAGE)) {
    return (
      <AccessDeniedCard description="You need permission to manage organization settings in order to access the business profile." />
    );
  }

  const organization = await getOrganization();
  return <OrganizationProfileWorkspace initialOrganization={organization} />;
}
