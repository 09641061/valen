"use client";

import { AlertTriangle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerDto } from "../schemas";

function DuplicateCustomerAlert({
  customer,
  onOpenProfile,
}: {
  customer: CustomerDto;
  onOpenProfile: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/40">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="flex-1 space-y-1.5">
          <p className="font-medium text-foreground">
            A customer with this phone already exists
          </p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserRound className="size-3.5" />
            <span className="tabular-nums">
              {customer.name} ({customer.phone})
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenProfile}
          >
            Open profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormStatusFeedback({
  duplicateCustomer,
  errorMessage,
  onOpenExisting,
}: {
  duplicateCustomer: CustomerDto | null;
  errorMessage: string | null;
  onOpenExisting: (customer: CustomerDto) => void;
}) {
  if (duplicateCustomer) {
    return (
      <DuplicateCustomerAlert
        customer={duplicateCustomer}
        onOpenProfile={() => onOpenExisting(duplicateCustomer)}
      />
    );
  }
  if (errorMessage) {
    return (
      <p className="text-xs text-destructive" role="alert">
        {errorMessage}
      </p>
    );
  }
  return null;
}
