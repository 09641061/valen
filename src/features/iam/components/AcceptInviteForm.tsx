"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCardShell } from "./AuthCardShell";
import { ErrorAlert } from "./IamFeedback";

export function AcceptInviteForm({
  token,
  email,
  initialFirstName,
  initialLastName,
}: {
  token: string;
  email: string;
  initialFirstName: string;
  initialLastName: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          first_name: firstName,
          last_name: lastName,
          password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error || "Could not accept invitation");
        setPending(false);
        return;
      }

      router.push("/calendar");
      router.refresh();
    } catch {
      setError("Could not connect to the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <AuthCardShell
      title="Accept your invitation"
      description={
        <>
          Complete your profile for{" "}
          <span className="font-medium text-foreground">{email}</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-first-name">First name</Label>
            <Input
              id="invite-first-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-last-name">Last name</Label>
            <Input
              id="invite-last-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-password">Create password</Label>
          <Input
            id="invite-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {pending ? "Joining workspace..." : "Join workspace"}
        </Button>
      </form>
    </AuthCardShell>
  );
}
