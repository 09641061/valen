"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction } from "../actions";
import { PERMISSION_GROUPS, actorHoldsPermission } from "../permissions";
import type { ActorDto, RoleDto } from "../schemas";
import { ErrorAlert, InfoCallout, DialogFormFooter } from "./IamFeedback";

export function CreateRoleDialog({
  actor,
  open,
  onOpenChange,
  onCreated,
}: {
  actor: ActorDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (role: RoleDto) => void;
}) {
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setSelectedPerms([]);
      setError(null);
    }
    onOpenChange(next);
  }

  function togglePerm(key: string, checked: boolean) {
    setSelectedPerms((prev) =>
      checked ? [...prev, key] : prev.filter((p) => p !== key),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRoleAction({
        name,
        permissions: selectedPerms,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onCreated(result.data);
      handleOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create permission group</DialogTitle>
          <DialogDescription>
            Define a set of capabilities that can be assigned to team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="create-role-name">Group name</Label>
            <Input
              id="create-role-name"
              required
              placeholder="e.g. Reception"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Group permissions
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedPerms.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const held = actorHoldsPermission(actor, item.key);
                      const checked = selectedPerms.includes(item.key);
                      return (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/40 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-55"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={!held || isPending}
                            onCheckedChange={(val) =>
                              togglePerm(item.key, Boolean(val))
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <InfoCallout>
            Owner is an account state and cannot be created as a group. You can
            only grant permissions that you currently hold.
          </InfoCallout>

          <DialogFormFooter
            onCancel={() => handleOpenChange(false)}
            isPending={isPending}
            submitLabel="Create group"
            pendingLabel="Creating..."
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
