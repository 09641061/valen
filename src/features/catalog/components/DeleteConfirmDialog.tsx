"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCategoryAction, deleteServiceAction } from "../actions";
import type { CategoryDto, ServiceDto } from "../schemas";

export type DeleteTarget =
  | { kind: "category"; category: CategoryDto }
  | { kind: "service"; service: ServiceDto };

interface DeleteConfirmDialogProps {
  target: DeleteTarget | null;
  onOpenChange: (open: boolean) => void;
  onStaleVersion: (message: string) => void;
  onSuccess: () => void;
}

export function DeleteConfirmDialog({
  target,
  onOpenChange,
  onStaleVersion,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!target) return;
    setError(null);

    startTransition(async () => {
      const result =
        target.kind === "category"
          ? await deleteCategoryAction({
              id: target.category.id,
              version: target.category.version,
            })
          : await deleteServiceAction({
              id: target.service.id,
              version: target.service.version,
            });

      if (!result.ok) {
        if (result.code === "STALE_VERSION") {
          onOpenChange(false);
          onStaleVersion(result.message);
          return;
        }
        setError(result.message);
        return;
      }

      onOpenChange(false);
      onSuccess();
    });
  }

  const title =
    target?.kind === "category"
      ? `Delete category "${target.category.name}"?`
      : target?.kind === "service"
        ? `Delete service "${target.service.name}"?`
        : "";

  const description =
    target?.kind === "category"
      ? target.category.services.length > 0
        ? `This will permanently delete the category and its ${target.category.services.length} services. This action cannot be undone.`
        : "This will permanently delete the category. This action cannot be undone."
      : "This will permanently delete the service. This action cannot be undone.";

  return (
    <AlertDialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
