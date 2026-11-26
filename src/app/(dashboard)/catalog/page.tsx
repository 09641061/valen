import type { Metadata } from "next";
import { CatalogWorkspace } from "@/features/catalog/components/CatalogWorkspace";
import { getCatalog } from "@/features/catalog/loaders";
import { getOrganization } from "@/features/organizations/loaders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog",
};

export default async function CatalogPage() {
  const [categories, organization] = await Promise.all([
    getCatalog(),
    getOrganization().catch(() => null),
  ]);
  return (
    <CatalogWorkspace
      initialCategories={categories}
      currencyCode={organization?.currency_code ?? "USD"}
    />
  );
}
