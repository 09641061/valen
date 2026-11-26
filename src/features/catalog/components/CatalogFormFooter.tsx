"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface CatalogFormFooterProps {
  isPending: boolean;
  isEditing: boolean;
  createLabel: string;
  onCancel: () => void;
}

export function CatalogFormFooter({
  isPending,
  isEditing,
  createLabel,
  onCancel,
}: CatalogFormFooterProps) {
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : isEditing ? "Save changes" : createLabel}
      </Button>
    </DialogFooter>
  );
}
