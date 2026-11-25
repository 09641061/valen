"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction } from "../actions";
import type { RoleDto } from "../schemas";
import { DialogFormFooter, ErrorAlert } from "./IamFeedback";

export function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (role: RoleDto) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRoleAction({
        name,
        permissions: [],
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create permission group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="create-role-name">Name</Label>
            <Input
              id="create-role-name"
              required
              placeholder="e.g. Reception"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
