"use client";

import { useState, useTransition } from "react";
import { Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { reorderRolesAction } from "../actions";
import { PERMISSIONS, canManageRole, hasPermission } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { RoleListItem } from "./RoleListItem";
import { RolePermissionsPanel } from "./RolePermissionsPanel";

export function RolesWorkspace({
  actor,
  initialRoles,
}: {
  actor: ActorDto;
  initialRoles: RoleDto[];
}) {
  const sortedInitial = [...initialRoles].sort(
    (a, b) => a.position - b.position,
  );
  const [roles, setRoles] = useState<RoleDto[]>(sortedInitial);
  const [selectedId, setSelectedId] = useState<string | null>(
    sortedInitial[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManageRoles = hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES);
  const normalized = query.trim().toLowerCase();
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(normalized),
  );
  const selectedRole =
    roles.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  function moveRole(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= roles.length) return;
    setReorderError(null);

    const next = [...roles];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const previous = roles;
    setRoles(next);

    startTransition(async () => {
      const result = await reorderRolesAction({
        ordered_ids: next.map((r) => r.id),
      });
      if (!result.ok) {
        setRoles(previous);
        setReorderError(result.message);
        return;
      }
      setRoles([...result.data].sort((a, b) => a.position - b.position));
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Roles and permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Create permission groups to organize team capabilities.
          </p>
        </div>
        {canManageRoles ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Create group
          </Button>
        ) : null}
      </div>

      {reorderError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {reorderError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit border-border bg-card shadow-xs">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Permission groups
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {roles.length} {roles.length === 1 ? "group" : "groups"}
              </span>
            </div>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Search groups"
                aria-label="Search permission groups"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No permission groups found.
              </div>
            ) : (
              filtered.map((role, index) => {
                const canReorder =
                  !normalized &&
                  canManageRoles &&
                  canManageRole(actor, role) &&
                  !isPending;
                const prevRole = index > 0 ? filtered[index - 1] : null;
                return (
                  <RoleListItem
                    key={role.id}
                    role={role}
                    isSelected={selectedRole?.id === role.id}
                    showReorder={canManageRoles && !normalized}
                    canMoveUp={
                      canReorder &&
                      prevRole !== null &&
                      canManageRole(actor, prevRole)
                    }
                    canMoveDown={canReorder && index < filtered.length - 1}
                    onSelect={() => setSelectedId(role.id)}
                    onMoveUp={() => moveRole(index, -1)}
                    onMoveDown={() => moveRole(index, 1)}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <div>
          {selectedRole ? (
            <RolePermissionsPanel
              key={selectedRole.id}
              actor={actor}
              role={selectedRole}
              onUpdated={(updated) =>
                setRoles((prev) =>
                  prev.map((r) => (r.id === updated.id ? updated : r)),
                )
              }
              onDeleted={(deletedId) => {
                const remaining = roles.filter((r) => r.id !== deletedId);
                setRoles(remaining);
                setSelectedId(remaining[0]?.id ?? null);
              }}
            />
          ) : (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Shield aria-hidden="true" className="size-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  Select a permission group
                </p>
                <p className="text-xs text-muted-foreground">
                  Choose a group from the left or create a new one to configure
                  permissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateRoleDialog
        actor={actor}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          setRoles((prev) =>
            [...prev, created].sort((a, b) => a.position - b.position),
          );
          setSelectedId(created.id);
        }}
      />
    </div>
  );
}
