"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assignMemberRolesAction } from "../actions";
import { getFullName } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";

export function AssignRolesDialog({
  actor,
  member,
  roles,
  onOpenChange,
  onAssigned,
}: {
  actor: ActorDto;
  member: ActorDto | null;
  roles: RoleDto[];
  onOpenChange: (open: boolean) => void;
  onAssigned: (updated: ActorDto) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    member ? member.roles.map((r) => r.id) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleRole(roleId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId),
    );
  }

  function handleSave() {
    if (!member) return;
    setError(null);
    startTransition(async () => {
      const result = await assignMemberRolesAction({
        member_id: member.id,
        role_ids: selectedIds,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onAssigned(result.data);
      onOpenChange(false);
    });
  }

  const orderedRoles = [...roles].sort((a, b) => a.position - b.position);

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign roles</DialogTitle>
          <DialogDescription>
            {member
              ? `Select permission groups for ${getFullName(member)}.`
              : "Select permission groups."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {orderedRoles.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No permission groups created yet.
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {orderedRoles.map((role) => {
                const checked = selectedIds.includes(role.id);
                const blockedByHierarchy =
                  actor.type !== "owner" && role.position <= actor.level;

                return (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={blockedByHierarchy || isPending}
                      onCheckedChange={(val) => toggleRole(role.id, Boolean(val))}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {role.name}
                      </p>
                      {blockedByHierarchy ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Above your hierarchy level
                        </p>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSave}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
