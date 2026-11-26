import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/iam/components/LoginForm";
import { getCurrentActor } from "@/features/iam/loaders";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const actor = await getCurrentActor().catch(() => null);
  if (actor) {
    redirect("/calendar");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <LoginForm />
    </main>
  );
}
