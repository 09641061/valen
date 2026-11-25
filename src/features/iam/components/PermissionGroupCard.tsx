"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  actorHoldsPermission,
  isIncludedInAdministrator,
  PERMISSIONS,
  type PermissionGroupDefinition,
} from "../permissions";
import type { ActorDto } from "../schemas";

export function PermissionGroupCard({
  actor,
  group,
  permissions,
  editable,
  isPending,
  onToggle,
}: {
  actor: ActorDto;
  group: PermissionGroupDefinition;
  permissions: string[];
  editable: boolean;
  isPending: boolean;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {group.title}
      </h3>
      <div className="divide-y divide-border rounded-lg border border-border">
        {group.items.map((item) => {
          const hasAdmin = permissions.includes(PERMISSIONS.IAM_ADMINISTRATOR);
          const impliedByAdmin =
            hasAdmin && isIncludedInAdministrator(item.key);
          const checked = impliedByAdmin || permissions.includes(item.key);
          const held = actorHoldsPermission(actor, item.key);
          const disabled = !editable || !held || isPending || impliedByAdmin;

          return (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between gap-4 px-3.5 py-2.5 transition-colors hover:bg-muted/30 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-65"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(val) => onToggle(item.key, Boolean(val))}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <span
                className={
                  checked
                    ? "shrink-0 text-xs font-medium text-sidebar-primary"
                    : "shrink-0 text-xs text-muted-foreground"
                }
              >
                {checked ? "Allowed" : "Not allowed"}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
