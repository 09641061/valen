"use client";

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addMonths, formatMonthHeader, getMonthGridDays, isValidDateKey } from "../date-utils";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const FALLBACK_MONTH = "2026-01-01";

interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DatePickerField({
  id,
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled,
  required,
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [viewMonth, setViewMonth] = useState(() =>
    isValidDateKey(value) ? value : FALLBACK_MONTH,
  );

  const displayValue = isEditing ? draft : value;
  const activeMonth = isValidDateKey(viewMonth) ? viewMonth : FALLBACK_MONTH;
  const days = getMonthGridDays(activeMonth);
  const activeMonthPrefix = activeMonth.slice(0, 7);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && isValidDateKey(value)) {
      setViewMonth(value);
    }
    setOpen(nextOpen);
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        value={displayValue}
        onFocus={() => { setDraft(value); setIsEditing(true); }}
        onChange={(e) => { setDraft(e.target.value); onChange(e.target.value); }}
        onBlur={() => setIsEditing(false)}
        aria-label={ariaLabel}
        disabled={disabled}
        required={required}
        className="pr-8 tabular-nums"
      />
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-xs" disabled={disabled} aria-label={ariaLabel ? `${ariaLabel} calendar` : "Open date picker"} className="absolute right-1 text-muted-foreground hover:text-foreground" />}>
          <CalendarIcon className="size-3.5" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-1">
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Previous month" onClick={() => setViewMonth((prev) => addMonths(prev, -1))}>
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <span className="text-xs font-semibold">{formatMonthHeader(activeMonth, "UTC")}</span>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Next month" onClick={() => setViewMonth((prev) => addMonths(prev, 1))}>
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => <span key={day} className="py-0.5">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const isSelected = day === value;
              const inMonth = day.slice(0, 7) === activeMonthPrefix;
              return (
                <Button
                  key={day}
                  type="button"
                  size="xs"
                  variant={isSelected ? "default" : "ghost"}
                  aria-label={day}
                  onClick={() => { onChange(day); setOpen(false); }}
                  className={cn("h-7 w-full justify-center px-0 tabular-nums", !inMonth && !isSelected && "text-muted-foreground/50")}
                >
                  {Number.parseInt(day.slice(8, 10), 10)}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
