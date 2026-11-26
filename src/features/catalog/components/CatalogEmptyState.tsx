"use client";

import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogEmptyStateProps {
  variant: "empty-catalog" | "empty-search";
  searchQuery?: string;
  onAction: () => void;
}

export function CatalogEmptyState({
  variant,
  searchQuery = "",
  onAction,
}: CatalogEmptyStateProps) {
  if (variant === "empty-catalog") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Tags className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Your catalog is empty
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first category to start adding services with duration and
          pricing.
        </p>
        <Button type="button" className="mt-6" onClick={onAction}>
          <Plus className="size-4" aria-hidden="true" />
          <span>Create first category</span>
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        No results found
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        No categories or services match &ldquo;{searchQuery}&rdquo;.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onAction}
      >
        Clear search
      </Button>
    </section>
  );
}
