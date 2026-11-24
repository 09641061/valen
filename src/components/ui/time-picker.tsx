"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalizeTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const h = Number.parseInt(colonMatch[1], 10);
    const m = Number.parseInt(colonMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 4) {
    const h = Number.parseInt(digits.slice(0, 2), 10);
    const m = Number.parseInt(digits.slice(2, 4), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  return null;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const displayValue = isEditing ? draft : value;
  const [currentHour, currentMinute] = TIME_PATTERN.test(value)
    ? value.split(":")
    : ["09", "00"];

  function handleBlur() {
    setIsEditing(false);
    const normalized = normalizeTimeInput(draft);
    if (normalized) {
      onChange(normalized);
    }
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder="HH:MM"
        maxLength={5}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        onFocus={() => {
          setDraft(value);
          setIsEditing(true);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          if (TIME_PATTERN.test(next)) {
            onChange(next);
          }
        }}
        onBlur={handleBlur}
        className="w-28 pr-8 tabular-nums"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
              aria-label={ariaLabel ? `${ariaLabel} picker` : "Open time picker"}
              className="absolute right-1 text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Clock className="size-3.5" aria-hidden="true" />
        </PopoverTrigger>

        <PopoverContent align="end" className="w-44 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="max-h-48 overflow-y-auto pr-1">
              <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hour
              </p>
              <div className="space-y-0.5">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => onChange(`${hour}:${currentMinute}`)}
                    className={cn(
                      "w-full rounded px-2 py-1 text-center text-xs tabular-nums transition-colors hover:bg-accent",
                      hour === currentHour &&
                        "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto pr-1">
              <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Min
              </p>
              <div className="space-y-0.5">
                {MINUTES.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => {
                      onChange(`${currentHour}:${minute}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full rounded px-2 py-1 text-center text-xs tabular-nums transition-colors hover:bg-accent",
                      minute === currentMinute &&
                        "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
