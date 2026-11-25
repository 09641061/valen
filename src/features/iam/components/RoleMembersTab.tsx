"use client";

import { useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assignMemberRolesAction } from "../actions";
import {
  canAssignMemberRoles,
  getFullName,
  getInitials,
} from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { ErrorAlert } from "./IamFeedback";

export function RoleMembersTab({
  actor,
  role,
  members,
  editable,
  onMemberUpdated,
}: {
  actor: ActorDto;
  role: RoleDto;
  members: ActorDto[];
  editable: boolean;
  onMemberUpdated: (updated: ActorDto) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roleMembers = members.filter((m) =>
    m.roles.some((r) => r.id === role.id),
  );
  const eligibleToAdd = members.filter(
    (m) =>
      !m.roles.some((r) => r.id === role.id) &&
      canAssignMemberRoles(actor, m),
  );

  function updateMembership(
    member: ActorDto,
    nextRoles: RoleDto[],
  ) {
    setError(null);
    setPendingMemberId(member.id);
    onMemberUpdated({ ...member, roles: nextRoles });

    startTransition(async () => {
      const result = await assignMemberRolesAction({
        member_id: member.id,
        role_ids: nextRoles.map((r) => r.id),
      });
      setPendingMemberId(null);
      if (!result.ok) {
        onMemberUpdated(member);
        setError(result.message);
        return;
      }
      onMemberUpdated(result.data);
    });
  }

  const normalizedAddQuery = addQuery.trim().toLowerCase();
  const filteredToAdd = eligibleToAdd.filter(
    (m) =>
      getFullName(m).toLowerCase().includes(normalizedAddQuery) ||
      m.email.toLowerCase().includes(normalizedAddQuery),
  );

  function handleAdd(member: ActorDto) {
    setPopoverOpen(false);
    setAddQuery("");
    updateMembership(member, [...member.roles, role]);
  }

  function handleRemove(member: ActorDto) {
    updateMembership(
      member,
      member.roles.filter((r) => r.id !== role.id),
    );
  }

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} />

      {editable ? (
        <div className="flex justify-end">
          <Popover
            open={popoverOpen}
            onOpenChange={(open) => {
              setPopoverOpen(open);
              if (!open) setAddQuery("");
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                />
              }
            >
              <UserPlus aria-hidden="true" className="mr-1.5 size-4" />
              Add member
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-2 p-2">
              <SearchInput
                size="sm"
                value={addQuery}
                onChange={setAddQuery}
                placeholder="Search members..."
                ariaLabel="Search members to add"
              />
              {filteredToAdd.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No eligible members found.
                </p>
              ) : (
                <div className="max-h-60 space-y-1 overflow-y-auto">
                  {filteredToAdd.map((member) => (
                    <Button
                      key={member.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2.5 font-normal"
                      onClick={() => handleAdd(member)}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                        {getInitials(member.first_name, member.last_name, member.email)}
                      </span>
                      <span className="truncate">{getFullName(member)}</span>
                    </Button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      ) : null}

      {roleMembers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
          No members assigned to this group yet.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {roleMembers.map((member) => {
            const canRemove = editable && canAssignMemberRoles(actor, member);
            const busy = pendingMemberId === member.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {getInitials(member.first_name, member.last_name, member.email)}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {getFullName(member)}
                  </span>
                </div>

                {canRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy || isPending}
                    aria-label={`Remove ${getFullName(member)} from ${role.name}`}
                    onClick={() => handleRemove(member)}
                  >
                    <X aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
