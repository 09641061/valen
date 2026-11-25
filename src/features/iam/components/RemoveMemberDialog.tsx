"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteMemberAction } from "../actions";
import { getFullName } from "../permissions";
import type { ActorDto } from "../schemas";
import { ErrorAlert } from "./IamFeedback";

export function RemoveMemberDialog({
  member,
  onOpenChange,
  onRemoved,
}: {
  member: ActorDto | null;
  onOpenChange: (open: boolean) => void;
  onRemoved: (memberId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!member) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteMemberAction({
        member_id: member.id,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onRemoved(member.id);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            {member
              ? `Remove ${getFullName(member)} (${member.email}) from the workspace? This cannot be undone.`
              : "Remove this member from the workspace?"}
          </DialogDescription>
        </DialogHeader>
        <ErrorAlert message={error} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Removing..." : "Remove member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
