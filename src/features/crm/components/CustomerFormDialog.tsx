"use client";

import { AlertTriangle, UserRound } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCustomerAction,
  updateCustomerAction,
  type RecentConversationOption,
} from "../actions";
import type { CustomerDto } from "../schemas";
import { ConversationPicker } from "./ConversationPicker";

interface CustomerFormDialogProps {
  open: boolean;
  customer: CustomerDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (customer: CustomerDto) => void;
  onOpenExistingProfile: (customer: CustomerDto) => void;
}

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
            <span>
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

function FormStatusFeedback({
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

function submitCustomerForm(
  customer: CustomerDto | null,
  name: string,
  phone: string,
) {
  if (customer) {
    return updateCustomerAction({
      id: customer.id,
      version: customer.version,
      name,
      phone,
    });
  }
  return createCustomerAction({ name, phone });
}

function getFormCopy(isEditing: boolean, isPending: boolean) {
  const title = isEditing ? "Edit customer" : "Add customer";
  const description = isEditing
    ? "Update customer name and international phone number."
    : "Create a customer record with an international phone number.";
  const submitLabel = isPending
    ? "Saving..."
    : isEditing
      ? "Save changes"
      : "Add customer";
  return { title, description, submitLabel };
}

export function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
  onSaved,
  onOpenExistingProfile,
}: CustomerFormDialogProps) {
  const isEditing = customer !== null;
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [duplicateCustomer, setDuplicateCustomer] =
    useState<CustomerDto | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectRecent(option: RecentConversationOption) {
    if (!option.customer) return;
    setName(option.customer.name);
    setPhone(option.customer.phone);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setDuplicateCustomer(null);

    startTransition(async () => {
      const result = await submitCustomerForm(customer, name, phone);
      if (!result.ok) {
        setErrorMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        if (result.code === "CONFLICT" && result.existingCustomer) {
          setDuplicateCustomer(result.existingCustomer);
        }
        return;
      }
      onSaved(result.data);
      onOpenChange(false);
    });
  }

  const { title, description, submitLabel } = getFormCopy(isEditing, isPending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && <ConversationPicker onSelect={handleSelectRecent} />}

          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              required
            />
            {fieldErrors.name?.[0] && (
              <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+573001234567"
              required
            />
            <p className="text-xs text-muted-foreground">
              Include the international prefix starting with + (e.g.
              +573001234567).
            </p>
            {fieldErrors.phone?.[0] && (
              <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>
            )}
          </div>

          <FormStatusFeedback
            duplicateCustomer={duplicateCustomer}
            errorMessage={errorMessage}
            onOpenExisting={(existing) => {
              onOpenChange(false);
              onOpenExistingProfile(existing);
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
