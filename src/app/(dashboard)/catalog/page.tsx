import type { Metadata } from "next";
import { CatalogWorkspace } from "@/features/catalog/components/CatalogWorkspace";
import { getCatalog } from "@/features/catalog/loaders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog",
};

export default async function CatalogPage() {
  const categories = await getCatalog();
  return <CatalogWorkspace initialCategories={categories} />;
}
