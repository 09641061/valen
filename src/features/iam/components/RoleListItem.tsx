"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { RoleDto } from "../schemas";

export function RoleListItem({
  role,
  isSelected,
  showReorder,
  canMoveUp,
  canMoveDown,
  onSelect,
  onMoveUp,
  onMoveDown,
}: {
  role: RoleDto;
  isSelected: boolean;
  showReorder: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
        isSelected
          ? "border-primary/40 bg-accent/60"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
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

      {showReorder ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Move ${role.name} up`}
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Move ${role.name} down`}
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDown aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
