import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KoduHeadIcon } from "@/components/ui/icons/kodu-head-icon";
import { AcceptInviteForm } from "@/features/iam/components/AcceptInviteForm";
import { verifyInviteOnServer } from "@/features/iam/loaders";

export const metadata: Metadata = {
  title: "Accept invitation",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const invite = await verifyInviteOnServer(token);

  if (!invite) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex items-center gap-2">
              <KoduHeadIcon className="size-8" />
              <span className="text-xl font-semibold tracking-[-0.04em] text-foreground">
                takodu
              </span>
            </div>
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-foreground">
                Invalid or expired invitation
              </CardTitle>
              <CardDescription>
                This invitation link is no longer valid or has already been used.
                Ask your workspace administrator to send a new invitation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button render={<Link href="/login" />} variant="outline">
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <AcceptInviteForm
        token={token}
        email={invite.email}
        initialFirstName={invite.first_name}
        initialLastName={invite.last_name}
      />
    </main>
  );
}
