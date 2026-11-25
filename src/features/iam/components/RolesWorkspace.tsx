"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { PERMISSIONS, canManageRole, hasPermission } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { ErrorAlert } from "./IamFeedback";
import { RoleListItem } from "./RoleListItem";
import { RolePermissionsPanel } from "./RolePermissionsPanel";
import { useRolesDnd } from "./useRolesDnd";

export function RolesWorkspace({
  actor,
  initialRoles,
  initialMembers,
}: {
  actor: ActorDto;
  initialRoles: RoleDto[];
  initialMembers: ActorDto[];
}) {
  const sortedInitial = [...initialRoles].sort(
    (a, b) => a.position - b.position,
  );
  const [roles, setRoles] = useState<RoleDto[]>(sortedInitial);
  const [members, setMembers] = useState<ActorDto[]>(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(
    sortedInitial[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const canManageRoles = hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES);
  const normalized = query.trim().toLowerCase();
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(normalized),
  );
  const selectedRole =
    roles.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const dnd = useRolesDnd({
    actor,
    roles,
    isFiltering: Boolean(normalized),
    canManageRoles,
    onRolesChange: setRoles,
    onError: setReorderError,
  });

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

      <ErrorAlert message={reorderError} />

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
            <SearchInput
              size="sm"
              placeholder="Search groups"
              ariaLabel="Search permission groups"
              value={query}
              onChange={setQuery}
            />
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No permission groups found.
              </div>
            ) : (
              <DndContext
                id="roles-dnd-context"
                sensors={dnd.sensors}
                collisionDetection={dnd.collisionDetection}
                onDragStart={dnd.handleDragStart}
                onDragEnd={dnd.handleDragEnd}
                onDragCancel={dnd.handleDragCancel}
              >
                <SortableContext
                  items={filtered.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {filtered.map((role) => (
                      <RoleListItem
                        key={role.id}
                        role={role}
                        isSelected={selectedRole?.id === role.id}
                        showReorder={canManageRoles && !normalized}
                        canDrag={canManageRole(actor, role) && !dnd.isPending}
                        onSelect={() => setSelectedId(role.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {dnd.activeDragRole ? (
                    <div className="rounded-lg border border-primary/40 bg-card p-2.5 shadow-lg">
                      <p className="truncate text-sm font-medium text-foreground">
                        {dnd.activeDragRole.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {dnd.activeDragRole.permissions.length} permissions
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <div>
          {selectedRole ? (
            <RolePermissionsPanel
              key={selectedRole.id}
              actor={actor}
              role={selectedRole}
              members={members}
              onUpdated={(updated) =>
                setRoles((prev) =>
                  prev.map((r) => (r.id === updated.id ? updated : r)),
                )
              }
              onDeleted={(deletedId) => {
                const remaining = roles.filter((r) => r.id !== deletedId);
                setRoles(remaining);
                setMembers((prev) =>
                  prev.map((m) => ({
                    ...m,
                    roles: m.roles.filter((r) => r.id !== deletedId),
                  })),
                );
                setSelectedId(remaining[0]?.id ?? null);
              }}
              onMemberUpdated={(updated) =>
                setMembers((prev) =>
                  prev.map((m) => (m.id === updated.id ? updated : m)),
                )
              }
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
