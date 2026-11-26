import { CustomersWorkspace } from "@/features/crm/components/CustomersWorkspace";
import { getCustomers } from "@/features/crm/loaders";
import type { CustomerPageDto } from "@/features/crm/schemas";

export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    customerId?: string | string[];
  }>;
}

function firstString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePage(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const resolved = await searchParams;
  const q = firstString(resolved.q).trim();
  const page = parsePage(firstString(resolved.page));
  const customerId = firstString(resolved.customerId).trim();

  let customerPage: CustomerPageDto = {
    items: [],
    total: 0,
    page,
    page_size: 20,
  };
  let loadError: string | null = null;

  try {
    customerPage = await getCustomers({ q: q || undefined, page, pageSize: 20 });
  } catch {
    loadError = "Unable to load customers right now. Please try again.";
  }

  const selectedCustomer =
    (customerId
      ? customerPage.items.find((item) => item.id === customerId)
      : undefined) ??
    customerPage.items[0] ??
    null;

  return (
    <div className="space-y-4">
      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      ) : null}
      <CustomersWorkspace
        customerPage={customerPage}
        initialQuery={q}
        initialSelectedCustomer={selectedCustomer}
      />
    </div>
  );
}
