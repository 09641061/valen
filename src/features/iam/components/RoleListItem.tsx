"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoleDto } from "../schemas";

export function RoleListItem({
  role,
  isSelected,
  showReorder,
  canDrag,
  onSelect,
}: {
  role: RoleDto;
  isSelected: boolean;
  showReorder: boolean;
  canDrag: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: role.id,
    disabled: !showReorder || !canDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
        isSelected
          ? "border-primary/40 bg-accent/60"
          : "border-border bg-card hover:bg-muted/40",
        isDragging && "z-10 opacity-60 shadow-md ring-2 ring-primary/30",
      )}
    >
      {showReorder ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Reorder ${role.name}`}
          disabled={!canDrag}
          className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </Button>
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-foreground">
          {role.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {role.permissions.length} permissions
        </p>
      </button>
    </div>
  );
}
