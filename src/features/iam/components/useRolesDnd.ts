"use client";

import {
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useTransition } from "react";
import { reorderRolesAction } from "../actions";
import { canManageRole } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";

interface UseRolesDndOptions {
  actor: ActorDto;
  roles: RoleDto[];
  isFiltering: boolean;
  canManageRoles: boolean;
  onRolesChange: (next: RoleDto[]) => void;
  onError: (message: string | null) => void;
}

export function useRolesDnd({
  actor,
  roles,
  isFiltering,
  canManageRoles,
  onRolesChange,
  onError,
}: UseRolesDndOptions) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeDragRole = activeDragId
    ? roles.find((r) => r.id === activeDragId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    if (isFiltering || !canManageRoles || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = roles.findIndex((r) => r.id === String(event.active.id));
    const newIndex = roles.findIndex((r) => r.id === String(event.over?.id));
    if (oldIndex < 0 || newIndex < 0) return;

    if (!canManageRole(actor, roles[oldIndex]) || !canManageRole(actor, roles[newIndex])) {
      return;
    }

    onError(null);
    const previous = roles;
    const next = arrayMove(roles, oldIndex, newIndex);
    onRolesChange(next);

    startTransition(async () => {
      const result = await reorderRolesAction({
        ordered_ids: next.map((r) => r.id),
      });
      if (!result.ok) {
        onRolesChange(previous);
        onError(result.message);
        return;
      }
      onRolesChange([...result.data].sort((a, b) => a.position - b.position));
    });
  }

  return {
    sensors,
    collisionDetection: closestCenter,
    activeDragRole,
    isPending,
    handleDragStart,
    handleDragEnd,
    handleDragCancel: () => setActiveDragId(null),
  };
}
