"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteInvitationAction, resendInvitationAction } from "../actions";
import { PERMISSIONS, getInitials, hasPermission } from "../permissions";
import type { ActorDto, InvitationDto } from "../schemas";
import {
  ErrorAlert,
  InfoCallout,
  SearchToolbar,
  WorkspaceHeader,
} from "./IamFeedback";
import { InviteMemberDialog } from "./InviteMemberDialog";

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvitationsWorkspace({
  actor,
  initialInvitations,
}: {
  actor: ActorDto;
  initialInvitations: InvitationDto[];
}) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManageUsers = hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS);
  const normalized = query.trim().toLowerCase();
  const filtered = invitations.filter((inv) =>
    inv.email.toLowerCase().includes(normalized),
  );

  function handleResend(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await resendInvitationAction(id);
      if (!res.ok) {
        setFeedback(res.message);
        return;
      }
      setInvitations((prev) =>
        prev.map((item) => (item.id === id ? res.data : item)),
      );
    });
  }

  function handleCancel(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteInvitationAction(id);
      if (!res.ok) {
        setFeedback(res.message);
        return;
      }
      setInvitations((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Invitations"
        description="Review pending invitations and resend or cancel access links."
        canInvite={canManageUsers}
        onInvite={() => setInviteOpen(true)}
      />

      <ErrorAlert message={feedback} />

      <SearchToolbar
        value={query}
        onChange={setQuery}
        placeholder="Search by email"
        ariaLabel="Search invitations by email"
        summary={`${filtered.length} ${filtered.length === 1 ? "invitation" : "invitations"} · pending`}
      />

      <Card className="overflow-hidden border-border bg-card shadow-xs">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <Mail aria-hidden="true" className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                No pending invitations
              </p>
              <p className="text-xs text-muted-foreground">
                Invite team members so they can set up their account and join.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                <span>Invited user</span>
                <span>Status</span>
                <span className="hidden sm:block">Expires</span>
                <span className="text-right">Actions</span>
              </div>
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {getInitials(inv.first_name, inv.last_name, inv.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {inv.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Member account
                      </p>
                    </div>
                  </div>

                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Pending
                  </Badge>

                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatExpiry(inv.expires_at)}
                  </span>

                  <div className="flex items-center justify-end gap-2">
                    {canManageUsers ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleResend(inv.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleCancel(inv.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InfoCallout>
        Invitations are not active members until accepted. Once a member
        completes registration, assign their permission groups in Members.
      </InfoCallout>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={(created) =>
          setInvitations((prev) => [created, ...prev])
        }
      />
    </div>
  );
}
