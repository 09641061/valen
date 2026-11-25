"use client";

import * as Alert from "@/components/ui/alert-dialog";
import type { CustomerDto } from "../schemas";

interface DeleteCustomerDialogProps {
  customer: CustomerDto | null;
  error: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCustomerDialog({
  customer,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteCustomerDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onCancel();
  }

  function handleActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <Alert.AlertDialog open={Boolean(customer)} onOpenChange={handleOpenChange}>
      <Alert.AlertDialogContent>
        <Alert.AlertDialogHeader>
          <Alert.AlertDialogTitle>Delete customer</Alert.AlertDialogTitle>
          <Alert.AlertDialogDescription>
            {customer
              ? `Delete ${customer.name} (${customer.phone})? This cannot be undone.`
              : "This action cannot be undone."}
          </Alert.AlertDialogDescription>
        </Alert.AlertDialogHeader>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <Alert.AlertDialogFooter>
          <Alert.AlertDialogCancel disabled={isDeleting}>
            Cancel
          </Alert.AlertDialogCancel>
          <Alert.AlertDialogAction
            onClick={handleActionClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Alert.AlertDialogAction>
        </Alert.AlertDialogFooter>
      </Alert.AlertDialogContent>
    </Alert.AlertDialog>
  );
}
