"use client";

import { ClockIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { buildTimeSlotsForDayHours } from "../business-hours";
import type { CalendarDayHours } from "../schemas";

interface TimePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  dayHours?: CalendarDayHours | null;
  "aria-label"?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function TimePickerField({
  id,
  value,
  onChange,
  dayHours,
  "aria-label": ariaLabel,
  disabled,
  required,
  className,
}: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const slots = buildTimeSlotsForDayHours(dayHours ?? null);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="HH:MM"
        maxLength={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        disabled={disabled}
        required={required}
        className="pr-8 tabular-nums"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-xs" disabled={disabled} aria-label={ariaLabel ? `${ariaLabel} slots` : "Open time picker"} className="absolute right-1 text-muted-foreground hover:text-foreground" />}>
          <ClockIcon className="size-3.5" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1.5">
          {slots.length === 0 ? (
            <p className="px-2 py-2 text-center text-xs text-muted-foreground">
              Business is closed on this day
            </p>
          ) : (
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {slots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  size="xs"
                  variant={slot === value ? "default" : "ghost"}
                  onClick={() => {
                    onChange(slot);
                    setOpen(false);
                  }}
                  className="w-full justify-start tabular-nums"
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
