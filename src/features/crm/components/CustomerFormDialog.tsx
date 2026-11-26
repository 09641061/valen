"use client";

import { useState } from "react";
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
} from "../actions";
import {
  normalizeCountryCodeInput,
  normalizeLocalNumberInput,
  splitE164Phone,
  validatePhoneParts,
  type PhoneValidationResult,
} from "../phone";
import type { CustomerDto } from "../schemas";
import { FormStatusFeedback } from "./CustomerFormFeedback";
import { PhoneNumberInputs } from "./PhoneNumberInputs";

interface CustomerFormDialogProps {
  open: boolean;
  customer: CustomerDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (customer: CustomerDto) => void;
  onOpenExistingProfile: (customer: CustomerDto) => void;
}

type PhoneErrors = Pick<
  PhoneValidationResult,
  "countryCodeError" | "localNumberError"
>;

function submitCustomerForm(
  customer: CustomerDto | null,
  name: string,
  phone: string,
) {
  if (customer) {
    return updateCustomerAction({
      id: customer.id,
      name,
      phone,
    });
  }
  return createCustomerAction({ name, phone });
}

function getFormCopy(isEditing: boolean, isPending: boolean) {
  return {
    title: isEditing ? "Edit customer" : "Add customer",
    description: isEditing
      ? "Update customer name and international phone number."
      : "Create a customer record with an international phone number.",
    submitLabel: isPending
      ? "Saving..."
      : isEditing
        ? "Save changes"
        : "Add customer",
  };
}

export function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
  onSaved,
  onOpenExistingProfile,
}: CustomerFormDialogProps) {
  const isEditing = customer !== null;
  const initialPhone = splitE164Phone(customer?.phone ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const [localNumber, setLocalNumber] = useState(initialPhone.localNumber);
  const [phoneErrors, setPhoneErrors] = useState<PhoneErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [duplicateCustomer, setDuplicateCustomer] =
    useState<CustomerDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFeedback(scope: "phone" | "name" | "all") {
    setErrorMessage(null);
    setDuplicateCustomer(null);
    if (scope === "phone" || scope === "all") {
      setPhoneErrors({});
    }
    setFieldErrors((prev) => {
      if (scope === "all") return {};
      if (!prev[scope]) return prev;
      const next = { ...prev };
      delete next[scope];
      return next;
    });
  }

  function applySplitPhone(rawPhone: string) {
    const parts = splitE164Phone(rawPhone);
    setCountryCode(parts.countryCode);
    setLocalNumber(parts.localNumber);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    clearFeedback("all");

    const trimmedName = name.trim();
    const phoneValidation = validatePhoneParts(countryCode, localNumber);
    if (!trimmedName || !phoneValidation.phone) {
      if (!trimmedName) setFieldErrors({ name: ["Name is required"] });
      setPhoneErrors({
        countryCodeError: phoneValidation.countryCodeError,
        localNumberError: phoneValidation.localNumberError,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitCustomerForm(
        customer,
        trimmedName,
        phoneValidation.phone,
      );
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
    } finally {
      setIsSubmitting(false);
    }
  }

  const { title, description, submitLabel } = getFormCopy(
    isEditing,
    isSubmitting,
  );
  const nameError = fieldErrors.name?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFeedback("name");
              }}
              placeholder="Jane Doe"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "customer-name-error" : undefined}
            />
            {nameError && (
              <p
                id="customer-name-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {nameError}
              </p>
            )}
          </div>
          <PhoneNumberInputs
            countryCode={countryCode}
            localNumber={localNumber}
            onCountryCodeChange={(value) => {
              setCountryCode(normalizeCountryCodeInput(value));
              clearFeedback("phone");
            }}
            onLocalNumberChange={(value) => {
              setLocalNumber(normalizeLocalNumberInput(value));
              clearFeedback("phone");
            }}
            onPasteFullPhone={(value) => {
              applySplitPhone(value);
              clearFeedback("phone");
            }}
            countryCodeError={phoneErrors.countryCodeError}
            localNumberError={
              phoneErrors.localNumberError ?? fieldErrors.phone?.[0]
            }
            disabled={isSubmitting}
          />
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
