"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS, getFullName, hasPermission } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { AssignRolesDialog } from "./AssignRolesDialog";
import {
  InfoCallout,
  SearchToolbar,
  WorkspaceHeader,
} from "./IamFeedback";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { MemberRow } from "./MemberRow";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export function MembersWorkspace({
  actor,
  initialMembers,
  roles,
}: {
  actor: ActorDto;
  initialMembers: ActorDto[];
  roles: RoleDto[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ActorDto | null>(null);
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

  const ownerCount = members.filter((m) => m.type === "owner").length;
  const memberCount = members.length - ownerCount;

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Members"
        description="Manage team access and permission groups for your workspace."
        canInvite={canManageUsers}
        onInvite={() => setInviteOpen(true)}
      />

      <SearchToolbar
        value={query}
        onChange={setQuery}
        placeholder="Search by name or email"
        ariaLabel="Search members"
        summary={`${members.length} ${members.length === 1 ? "member" : "members"} · ${ownerCount} Owner · ${memberCount} ${memberCount === 1 ? "Member" : "Members"}`}
      />

      <Card className="overflow-hidden border-border bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid-cols-[1.4fr_1fr_auto]">
              <span>Member</span>
              <span className="hidden md:block">Account type &amp; groups</span>
              <span className="text-right">Actions</span>
            </div>

            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                actor={actor}
                member={member}
                onAssignRoles={setAssignTarget}
                onRemove={setRemoveTarget}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <InfoCallout>
        Account state and permissions are separate. Owner is an account state
        and is not assigned as a group. Permission groups accumulate
        capabilities across assigned roles.
      </InfoCallout>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => {}}
      />

      <AssignRolesDialog
        key={assignTarget?.id ?? "none"}
        actor={actor}
        member={assignTarget}
        roles={roles}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        onAssigned={(updated) =>
          setMembers((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          )
        }
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
