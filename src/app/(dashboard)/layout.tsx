import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { requireCurrentActor } from "@/features/iam/loaders";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireCurrentActor();
  return <AppShell user={actor}>{children}</AppShell>;
}
