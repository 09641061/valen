"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CatalogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Could not load catalog
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        There was a problem reaching the catalog service. Check your connection
        and try again.
      </p>
      <Button type="button" className="mt-6" onClick={() => reset()}>
        <RotateCcw className="size-4" aria-hidden="true" />
        <span>Retry</span>
      </Button>
    </section>
  );
}
