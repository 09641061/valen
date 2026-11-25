"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS, getFullName, hasPermission } from "../permissions";
import type { ActorDto } from "../schemas";
import { SearchToolbar, WorkspaceHeader } from "./IamFeedback";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { MemberRow } from "./MemberRow";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export function MembersWorkspace({
  actor,
  initialMembers,
}: {
  actor: ActorDto;
  initialMembers: ActorDto[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ActorDto | null>(null);

  const canManageUsers = hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS);
  const normalized = query.trim().toLowerCase();
  const filtered = members.filter((m) => {
    const fullName = getFullName(m).toLowerCase();
    return (
      fullName.includes(normalized) ||
      m.email.toLowerCase().includes(normalized)
    );
  });

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Members"
        description="Manage team access for your workspace."
        canInvite={canManageUsers}
        onInvite={() => setInviteOpen(true)}
      />

      <SearchToolbar
        value={query}
        onChange={setQuery}
        placeholder="Search by name or email"
        ariaLabel="Search members"
      />

      <Card className="overflow-hidden border-border bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid-cols-[1.4fr_1fr_auto]">
              <span>Member</span>
              <span className="hidden md:block">Account type</span>
              <span className="text-right">Actions</span>
            </div>

            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                actor={actor}
                member={member}
                onRemove={setRemoveTarget}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => {}}
      />

      <RemoveMemberDialog
        key={removeTarget?.id ?? "remove-none"}
        member={removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onRemoved={(removedId) =>
          setMembers((prev) => prev.filter((m) => m.id !== removedId))
        }
      />
    </div>
  );
}
