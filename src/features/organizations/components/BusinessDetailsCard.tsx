"use client";

import { useState, useTransition } from "react";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TimezoneCombobox,
  useLocalTimezone,
} from "@/components/ui/timezone-combobox";
import { updateBusinessDetailsAction } from "../actions";
import {
  validateBusinessDetails,
  type BusinessDetailsFieldErrors,
  type OrganizationDto,
} from "../schemas";
import { OrganizationFormCard } from "./OrganizationFormCard";

interface BusinessDetailsCardProps {
  organization: OrganizationDto;
  onUpdated: (org: OrganizationDto) => void;
}

export function BusinessDetailsCard({
  organization,
  onUpdated,
}: BusinessDetailsCardProps) {
  const [name, setName] = useState(organization.name);
  const [contactEmail, setContactEmail] = useState(organization.contact_email);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState(
    organization.currency_code || "USD",
  );
  const localTimezone = useLocalTimezone();
  const [fieldErrors, setFieldErrors] = useState<BusinessDetailsFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shouldDefaultToLocal =
    !organization.timezone || organization.timezone === "UTC";
  const timezone =
    selectedTimezone ??
    (shouldDefaultToLocal && localTimezone
      ? localTimezone
      : organization.timezone);

  function currentDraft() {
    return {
      name,
      contact_email: contactEmail,
      timezone,
      currency_code: currencyCode,
    };
  }

  function clearOrValidateField(
    field: keyof BusinessDetailsFieldErrors,
    nextDraft: Partial<{ name: string; contact_email: string }>,
  ) {
    setSavedMessage(null);
    if (!fieldErrors[field]) return;
    const errs = validateBusinessDetails({ ...currentDraft(), ...nextDraft });
    setFieldErrors((p) => ({ ...p, [field]: errs[field] }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSavedMessage(null);

    const errors = validateBusinessDetails(currentDraft());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const result = await updateBusinessDetailsAction(currentDraft());
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as BusinessDetailsFieldErrors);
        }
        setErrorMessage(result.message);
        return;
      }
      onUpdated(result.data);
      setName(result.data.name);
      setContactEmail(result.data.contact_email);
      setSelectedTimezone(result.data.timezone);
      setCurrencyCode(result.data.currency_code);
      setFieldErrors({});
      setSavedMessage("Saved");
    });
  }

  return (
    <OrganizationFormCard
      title="Business details"
      submitLabel="Save changes"
      isPending={isPending}
      errorMessage={errorMessage}
      savedMessage={savedMessage}
      onSubmit={handleSubmit}
      contentClassName="grid gap-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="business-name">Business name</Label>
        <Input
          id="business-name"
          value={name}
          aria-invalid={Boolean(fieldErrors.name)}
          onChange={(e) => {
            setName(e.target.value);
            clearOrValidateField("name", { name: e.target.value });
          }}
          onBlur={() =>
            setFieldErrors((p) => ({
              ...p,
              name: validateBusinessDetails(currentDraft()).name,
            }))
          }
          minLength={2}
          maxLength={120}
        />
        {fieldErrors.name ? (
          <p className="text-xs text-destructive">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Contact email</Label>
        <Input
          id="contact-email"
          type="email"
          value={contactEmail}
          aria-invalid={Boolean(fieldErrors.contact_email)}
          onChange={(e) => {
            setContactEmail(e.target.value);
            clearOrValidateField("contact_email", { contact_email: e.target.value });
          }}
          onBlur={() =>
            setFieldErrors((p) => ({
              ...p,
              contact_email: validateBusinessDetails(currentDraft()).contact_email,
            }))
          }
          minLength={5}
          maxLength={254}
          placeholder="contact@business.com"
        />
        {fieldErrors.contact_email ? (
          <p className="text-xs text-destructive">{fieldErrors.contact_email}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="business-timezone">Timezone</Label>
        <TimezoneCombobox
          id="business-timezone"
          value={timezone}
          aria-invalid={Boolean(fieldErrors.timezone)}
          onValueChange={(value) => {
            setSelectedTimezone(value);
            setSavedMessage(null);
            setFieldErrors((p) => ({ ...p, timezone: undefined }));
          }}
        />
        {fieldErrors.timezone ? (
          <p className="text-xs text-destructive">{fieldErrors.timezone}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="business-currency">Currency</Label>
        <CurrencyCombobox
          id="business-currency"
          value={currencyCode}
          aria-invalid={Boolean(fieldErrors.currency_code)}
          onValueChange={(value) => {
            setCurrencyCode(value);
            setSavedMessage(null);
            setFieldErrors((p) => ({ ...p, currency_code: undefined }));
          }}
        />
        {fieldErrors.currency_code ? (
          <p className="text-xs text-destructive">{fieldErrors.currency_code}</p>
        ) : null}
      </div>
    </OrganizationFormCard>
  );
}
