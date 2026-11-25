"use client";

import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CatalogHeaderProps {
  searchQuery: string;
  isFiltering: boolean;
  errorMessage: string | null;
  onSearchChange: (value: string) => void;
  onNewCategory: () => void;
  onDismissError: () => void;
}

export function CatalogHeader({
  searchQuery,
  isFiltering,
  errorMessage,
  onSearchChange,
  onNewCategory,
  onDismissError,
}: CatalogHeaderProps) {
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your categories and bookable services.
          </p>
        </div>

        <Button type="button" onClick={onNewCategory}>
          <Plus className="size-4" aria-hidden="true" />
          <span>New category</span>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search categories or services..."
            aria-label="Search catalog"
            className="pr-8 pl-9"
          />
          {isFiltering ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        {isFiltering ? (
          <p className="text-xs text-muted-foreground">
            Clear search to reorder categories or services.
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Dismiss error"
            onClick={onDismissError}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
