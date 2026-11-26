"use client";

import { useId, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneNumberInputsProps {
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  onPasteFullPhone: (value: string) => void;
  countryCodeError?: string;
  localNumberError?: string;
  disabled?: boolean;
}

export function PhoneNumberInputs({
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  onPasteFullPhone,
  countryCodeError,
  localNumberError,
  disabled = false,
}: PhoneNumberInputsProps) {
  const hintId = useId();
  const codeErrorId = useId();
  const numberErrorId = useId();

  const codeDescribedBy = countryCodeError ? `${hintId} ${codeErrorId}` : hintId;
  const numberDescribedBy = localNumberError
    ? `${hintId} ${numberErrorId}`
    : hintId;

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const raw = event.clipboardData.getData("text");
    const stripped = raw.trim().replace(/[\s\-()]/g, "");
    const digits = stripped.replace(/[^0-9]/g, "");
    if (stripped.startsWith("+") && digits.length >= 7) {
      event.preventDefault();
      onPasteFullPhone(stripped);
    }
  }

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium leading-none">Phone</legend>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-end gap-2">
        <div className="space-y-1">
          <Label
            htmlFor="customer-country-code"
            className="whitespace-nowrap text-xs text-muted-foreground"
          >
            Country code
          </Label>
          <Input
            id="customer-country-code"
            type="tel"
            inputMode="tel"
            autoComplete="tel-country-code"
            placeholder="+57"
            className="tabular-nums"
            value={countryCode}
            onChange={(event) => onCountryCodeChange(event.target.value)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-required="true"
            aria-invalid={Boolean(countryCodeError)}
            aria-describedby={codeDescribedBy}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="customer-phone-number"
            className="whitespace-nowrap text-xs text-muted-foreground"
          >
            Phone number
          </Label>
          <Input
            id="customer-phone-number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="3001234567"
            className="tabular-nums"
            value={localNumber}
            onChange={(event) => onLocalNumberChange(event.target.value)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-required="true"
            aria-invalid={Boolean(localNumberError)}
            aria-describedby={numberDescribedBy}
          />
        </div>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        Enter the country code (e.g. +57) and digits-only phone number.
      </p>
      {countryCodeError && (
        <p id={codeErrorId} className="text-xs text-destructive" role="alert">
          {countryCodeError}
        </p>
      )}
      {localNumberError && (
        <p id={numberErrorId} className="text-xs text-destructive" role="alert">
          {localNumberError}
        </p>
      )}
    </fieldset>
  );
}
