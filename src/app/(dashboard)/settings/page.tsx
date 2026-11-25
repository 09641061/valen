import type { Metadata } from "next";
import { AccountSettingsForm } from "@/features/iam/components/AccountSettingsForm";
import { requireCurrentActor } from "@/features/iam/loaders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account settings",
};

export default async function SettingsPage() {
  const actor = await requireCurrentActor();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Account settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, password, and active session.
        </p>
      </header>
      <AccountSettingsForm initialActor={actor} />
    </div>
  );
}
