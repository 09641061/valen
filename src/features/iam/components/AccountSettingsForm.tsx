"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMeAction } from "../actions";
import type { ActorDto } from "../schemas";

export function AccountSettingsForm({
  initialActor,
}: {
  initialActor: ActorDto;
}) {
  const router = useRouter();
  const [actor, setActor] = useState(initialActor);
  const [firstName, setFirstName] = useState(initialActor.first_name);
  const [lastName, setLastName] = useState(initialActor.last_name);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await updateMeAction({
        first_name: firstName,
        last_name: lastName,
      });

      if (!result.ok) {
        setFeedback({ type: "error", text: result.message });
        return;
      }

      setActor(result.data);
      setFirstName(result.data.first_name);
      setLastName(result.data.last_name);
      setFeedback({ type: "success", text: "Account settings saved." });
      router.refresh();
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Profile</CardTitle>
          <CardDescription>
            Update your personal details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {feedback ? (
              <div
                role={feedback.type === "error" ? "alert" : "status"}
                className={
                  feedback.type === "error"
                    ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    : "rounded-lg border border-primary/30 bg-accent px-3 py-2 text-sm text-accent-foreground"
                }
              >
                {feedback.text}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email address</Label>
              <Input
                id="settings-email"
                type="email"
                value={actor.email}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-first-name">First name</Label>
                <Input
                  id="settings-first-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-last-name">Last name</Label>
                <Input
                  id="settings-last-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Session</CardTitle>
            <CardDescription>
              Sign out of your account on this browser.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            <LogOut aria-hidden="true" className="mr-2 size-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
