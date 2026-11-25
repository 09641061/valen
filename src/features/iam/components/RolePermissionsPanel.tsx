"use client";

import { useState, useTransition } from "react";
import { Info, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteRoleAction, updateRoleAction } from "../actions";
import {
  PERMISSION_GROUPS,
  canManageRole,
  wouldCauseManageRolesLockout,
} from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { PermissionGroupCard } from "./PermissionGroupCard";

function hasRoleChanges(
  role: RoleDto,
  name: string,
  permissions: string[],
): boolean {
  if (name !== role.name) return true;
  const next = permissions.slice().sort().join(",");
  const prev = role.permissions.slice().sort().join(",");
  return next !== prev;
}

function RoleFeedback({
  feedback,
}: {
  feedback: { type: "success" | "error"; text: string } | null;
}) {
  if (!feedback) return null;
  const isError = feedback.type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-lg border border-primary/30 bg-accent px-3 py-2 text-sm text-accent-foreground"
      }
    >
      {feedback.text}
    </div>
  );
}

export function RolePermissionsPanel({
  actor,
  role,
  onUpdated,
  onDeleted,
}: {
  actor: ActorDto;
  role: RoleDto;
  onUpdated: (updated: RoleDto) => void;
  onDeleted: (roleId: string) => void;
}) {
  const [name, setName] = useState(role.name);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const editable = canManageRole(actor, role);
  const lockoutWarning = wouldCauseManageRolesLockout(actor, role.id, permissions);
  const isDirty = hasRoleChanges(role, name, permissions);

  function togglePerm(key: string, checked: boolean) {
    setFeedback(null);
    setPermissions((prev) =>
      checked ? [...prev, key] : prev.filter((p) => p !== key),
    );
  }

  function handleReset() {
    setName(role.name);
    setPermissions(role.permissions);
    setFeedback(null);
  }

  function handleSave() {
    if (lockoutWarning) {
      setFeedback({
        type: "error",
        text: "You cannot remove your own role management capability from a shared group.",
      });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await updateRoleAction({
        role_id: role.id,
        name,
        permissions,
      });
      if (!result.ok) {
        setFeedback({ type: "error", text: result.message });
        return;
      }
      onUpdated(result.data);
      setFeedback({ type: "success", text: "Group permissions saved." });
    });
  }

  function handleDelete() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteRoleAction({
        role_id: role.id,
      });
      if (!result.ok) {
        setFeedback({ type: "error", text: result.message });
        return;
      }
      onDeleted(role.id);
    });
  }

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Effective permissions
            </CardTitle>
            {!editable ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock aria-hidden="true" className="size-3" />
                Read-only
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Permissions granted by <span className="font-medium text-foreground">{role.name}</span>{" "}
            accumulate with any other groups assigned to a member.
          </p>
        </div>

        {editable ? (
          <DeleteRoleDialog
            roleName={role.name}
            disabled={isPending}
            onConfirm={handleDelete}
          />
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <RoleFeedback feedback={feedback} />

        <div className="space-y-1.5">
          <Label htmlFor="edit-role-name">Group name</Label>
          <Input
            id="edit-role-name"
            value={name}
            disabled={!editable || isPending}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-5">
          {PERMISSION_GROUPS.map((group) => (
            <PermissionGroupCard
              key={group.id}
              actor={actor}
              group={group}
              permissions={permissions}
              editable={editable}
              isPending={isPending}
              onToggle={togglePerm}
            />
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-accent/50 p-3.5 text-xs text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
          <p>
            Hierarchy is independent. Broad permissions do not allow managing
            higher-ranked groups or members.
          </p>
        </div>

        {editable ? (
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isPending}
              onClick={handleReset}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!isDirty || isPending || lockoutWarning}
              onClick={handleSave}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
