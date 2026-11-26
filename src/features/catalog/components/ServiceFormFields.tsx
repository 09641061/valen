"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServiceFormFieldsProps {
  name: string;
  duration: string;
  price: string;
  currencyCode: string;
  isPending: boolean;
  fieldErrors: Record<string, string>;
  onNameChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPriceChange: (value: string) => void;
}

export function ServiceFormFields({
  name,
  duration,
  price,
  currencyCode,
  isPending,
  fieldErrors,
  onNameChange,
  onDurationChange,
  onPriceChange,
}: ServiceFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="service-name">Service name</Label>
        <Input
          id="service-name"
          name="name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Classic haircut"
          maxLength={120}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.name)}
          autoFocus
        />
        {fieldErrors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="service-duration">Duration (min)</Label>
          <Input
            id="service-duration"
            name="duration_minutes"
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(event) => onDurationChange(event.target.value)}
            disabled={isPending}
            aria-invalid={Boolean(fieldErrors.duration_minutes)}
          />
          {fieldErrors.duration_minutes ? (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.duration_minutes}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-price">Price ({currencyCode})</Label>
          <Input
            id="service-price"
            name="price"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(event) => onPriceChange(event.target.value)}
            placeholder="25.00"
            disabled={isPending}
            aria-invalid={Boolean(fieldErrors.price_minor_units)}
          />
          {fieldErrors.price_minor_units ? (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.price_minor_units}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
