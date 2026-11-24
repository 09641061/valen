"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FREQUENT_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
] as const;

const emptySubscribe = () => () => {};

function getClientTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function useLocalTimezone(): string | null {
  return useSyncExternalStore(emptySubscribe, getClientTimezone, () => null);
}

function getAllTimezones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // Fallback to frequent list when supportedValuesOf is unavailable.
  }
  return [...FREQUENT_TIMEZONES];
}

function getTimezoneOffset(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const tzPart = parts.find((part) => part.type === "timeZoneName")?.value;
    return tzPart === "GMT" ? "UTC" : (tzPart ?? "");
  } catch {
    return "";
  }
}

interface TimezoneComboboxProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  "aria-invalid"?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimezoneCombobox({
  id,
  value,
  onValueChange,
  "aria-invalid": ariaInvalid,
  disabled,
  className,
}: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const localTimezone = useLocalTimezone();

  const allTimezones = useMemo(() => getAllTimezones(), []);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTimezones = useMemo(() => {
    if (!normalizedQuery) return [];
    return allTimezones
      .filter((tz) => tz.toLowerCase().includes(normalizedQuery))
      .slice(0, 40);
  }, [allTimezones, normalizedQuery]);

  const frequentList = useMemo(
    () => FREQUENT_TIMEZONES.filter((tz) => tz !== localTimezone),
    [localTimezone],
  );

  const selectedOffset = value ? getTimezoneOffset(value) : "";

  function handleSelect(tz: string) {
    onValueChange(tz);
    setOpen(false);
    setQuery("");
  }

  function renderOption(tz: string) {
    const offset = getTimezoneOffset(tz);
    const isSelected = tz === value;
    return (
      <button
        key={tz}
        type="button"
        onClick={() => handleSelect(tz)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent/60 font-medium",
        )}
      >
        <span className="truncate">{tz}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          {offset ? <span>{offset}</span> : null}
          <Check
            className={cn("size-3.5", isSelected ? "opacity-100" : "opacity-0")}
            aria-hidden="true"
          />
        </span>
      </button>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <span className="truncate">{value || "Select timezone"}</span>
          {selectedOffset ? (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              ({selectedOffset})
            </span>
          ) : null}
        </span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search timezone..."
          aria-label="Search timezone"
          autoFocus
        />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {normalizedQuery ? (
            filteredTimezones.length > 0 ? (
              filteredTimezones.map(renderOption)
            ) : (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No timezones found.
              </p>
            )
          ) : (
            <>
              {localTimezone ? (
                <div>
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Local
                  </p>
                  {renderOption(localTimezone)}
                </div>
              ) : null}
              <div>
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Frequent
                </p>
                {frequentList.map(renderOption)}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
