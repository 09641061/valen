"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { CreateCategorySchema, type CategoryDto } from "../schemas";
import { CatalogFormFooter } from "./CatalogFormFooter";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDto | null;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const isEditing = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = CreateCategorySchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }

    startTransition(async () => {
      const result = category
        ? await updateCategoryAction({
            id: category.id,
            name: parsed.data.name,
          })
        : await createCategoryAction({ name: parsed.data.name });

      if (!result.ok) {
        setError(result.fieldErrors?.name?.[0] ?? result.message);
        return;
      }

      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the name of this catalog category."
              : "Create a category to organize your services."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Haircuts & styling"
              maxLength={120}
              disabled={isPending}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <CatalogFormFooter
            isPending={isPending}
            isEditing={isEditing}
            createLabel="Create category"
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
