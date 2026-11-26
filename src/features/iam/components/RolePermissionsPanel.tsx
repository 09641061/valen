"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteRoleAction, updateRoleAction } from "../actions";
import {
  PERMISSION_GROUPS,
  canManageRole,
  wouldCauseManageRolesLockout,
} from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { PermissionGroupCard } from "./PermissionGroupCard";
import { RoleMembersTab } from "./RoleMembersTab";

function hasPermissionChanges(role: RoleDto, permissions: string[]): boolean {
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
  members,
  onUpdated,
  onDeleted,
  onMemberUpdated,
}: {
  actor: ActorDto;
  role: RoleDto;
  members: ActorDto[];
  onUpdated: (updated: RoleDto) => void;
  onDeleted: (roleId: string) => void;
  onMemberUpdated: (updated: ActorDto) => void;
}) {
  const [activeTab, setActiveTab] = useState<"permissions" | "members">(
    "permissions",
  );
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const editable = canManageRole(actor, role);
  const lockoutWarning = wouldCauseManageRolesLockout(actor, role.id, permissions);
  const isDirty = hasPermissionChanges(role, permissions);
  const roleMembersCount = members.filter((m) =>
    m.roles.some((r) => r.id === role.id),
  ).length;

  function togglePerm(key: string, checked: boolean) {
    setFeedback(null);
    setPermissions((prev) =>
      checked ? [...prev, key] : prev.filter((p) => p !== key),
    );
  }

  function handleReset() {
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
        name: role.name,
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
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
          {!editable ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Lock aria-hidden="true" className="size-3" />
              Read-only
            </Badge>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Group configuration"
          className="inline-flex rounded-lg border bg-muted/40 p-0.5"
        >
          <Button
            type="button"
            size="sm"
            variant={activeTab === "permissions" ? "secondary" : "ghost"}
            aria-pressed={activeTab === "permissions"}
            onClick={() => setActiveTab("permissions")}
          >
            Permissions
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "members" ? "secondary" : "ghost"}
            aria-pressed={activeTab === "members"}
            onClick={() => setActiveTab("members")}
          >
            Members ({roleMembersCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {activeTab === "members" ? (
          <RoleMembersTab
            actor={actor}
            role={role}
            members={members}
            editable={editable}
            onMemberUpdated={onMemberUpdated}
          />
        ) : (
          <>
            <RoleFeedback feedback={feedback} />

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

            {editable ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <DeleteRoleDialog
                  roleName={role.name}
                  disabled={isPending}
                  onConfirm={handleDelete}
                />
                <div className="flex items-center gap-2">
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
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
