"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { updateBusinessHoursAction } from "../actions";
import {
  DAY_KEYS,
  DAY_LABELS,
  DayHoursSchema,
  type BusinessHours,
  type DayKey,
  type OrganizationDto,
} from "../schemas";
import { OrganizationFormCard } from "./OrganizationFormCard";

interface BusinessHoursCardProps {
  organization: OrganizationDto;
  onUpdated: (org: OrganizationDto) => void;
  onStaleVersion: (message: string) => void;
}

export function BusinessHoursCard({
  organization,
  onUpdated,
  onStaleVersion,
}: BusinessHoursCardProps) {
  const [hours, setHours] = useState<BusinessHours>(organization.business_hours);
  const [dayErrors, setDayErrors] = useState<Partial<Record<DayKey, string>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validateHours(nextHours: BusinessHours): Partial<Record<DayKey, string>> {
    const errors: Partial<Record<DayKey, string>> = {};
    for (const dayKey of DAY_KEYS) {
      const parsed = DayHoursSchema.safeParse(nextHours[dayKey]);
      if (!parsed.success) {
        errors[dayKey] = parsed.error.issues[0]?.message ?? "Invalid hours";
      }
    }
    return errors;
  }

  function updateDay(day: DayKey, patch: Partial<BusinessHours[DayKey]>): void {
    const nextHours = { ...hours, [day]: { ...hours[day], ...patch } };
    setHours(nextHours);
    setSavedMessage(null);
    setDayErrors(validateHours(nextHours));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSavedMessage(null);

    const errors = validateHours(hours);
    setDayErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      const result = await updateBusinessHoursAction({
        version: organization.version,
        business_hours: hours,
      });
      if (!result.ok) {
        if (result.code === "STALE_VERSION") {
          onStaleVersion(result.message);
        } else {
          setErrorMessage(result.message);
        }
        return;
      }
      onUpdated(result.data);
      setHours(result.data.business_hours);
      setDayErrors({});
      setSavedMessage("Saved");
    });
  }

  return (
    <OrganizationFormCard
      title="General business hours"
      submitLabel="Save changes"
      isPending={isPending}
      errorMessage={errorMessage}
      savedMessage={savedMessage}
      onSubmit={handleSubmit}
      contentClassName="space-y-2.5"
    >
      {DAY_KEYS.map((dayKey) => {
        const day = hours[dayKey];
        const label = DAY_LABELS[dayKey];
        const dayError = dayErrors[dayKey];
        return (
          <div key={dayKey} className="space-y-1">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 py-1">
              <div className="flex min-w-32 items-center gap-3">
                <Switch
                  checked={day.is_open}
                  onCheckedChange={(checked) =>
                    updateDay(dayKey, { is_open: checked })
                  }
                  aria-label={`${label} open`}
                />
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </div>

              {day.is_open ? (
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={day.open_time}
                    aria-invalid={Boolean(dayError)}
                    onChange={(value) =>
                      updateDay(dayKey, { open_time: value })
                    }
                    aria-label={`${label} opening time`}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <TimePicker
                    value={day.close_time}
                    aria-invalid={Boolean(dayError)}
                    onChange={(value) =>
                      updateDay(dayKey, { close_time: value })
                    }
                    aria-label={`${label} closing time`}
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
            {dayError ? (
              <p className="text-right text-xs text-destructive">{dayError}</p>
            ) : null}
          </div>
        );
      })}
    </OrganizationFormCard>
  );
}
