"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvitationAction } from "../actions";
import type { InvitationDto } from "../schemas";
import { ErrorAlert, InfoCallout, DialogFormFooter } from "./IamFeedback";

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (invitation: InvitationDto) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setEmail("");
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createInvitationAction({ email });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onInvited(result.data);
      handleOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new team member to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="name@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The invited person will join as a Member.
            </p>
          </div>

          <InfoCallout>
            Owner is an account state and cannot be assigned. After they join,
            you can assign permission groups from the Members tab.
          </InfoCallout>

          <DialogFormFooter
            onCancel={() => handleOpenChange(false)}
            isPending={isPending}
            submitLabel="Send invitation"
            pendingLabel="Sending..."
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
