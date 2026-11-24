import type { Metadata } from "next";
import { OrganizationProfileWorkspace } from "@/features/organizations/components/OrganizationProfileWorkspace";
import { getOrganization } from "@/features/organizations/loaders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business profile",
};

export default async function OrganizationPage() {
  const organization = await getOrganization();
  return (
    <OrganizationProfileWorkspace
      key={organization.version}
      initialOrganization={organization}
    />
  );
}
