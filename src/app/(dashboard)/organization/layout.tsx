import type { ReactNode } from "react";
import { OrganizationTabs } from "@/features/organizations/components/OrganizationTabs";

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Organization
        </h1>
        <OrganizationTabs />
      </header>
      {children}
    </div>
  );
}
