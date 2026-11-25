"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FREQUENT_CURRENCIES = [
  "USD",
  "PEN",
  "MXN",
  "EUR",
  "COP",
  "CLP",
  "ARS",
  "BRL",
] as const;

function getAllCurrencies(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("currency");
    }
  } catch {
    // Fallback to frequent list when supportedValuesOf is unavailable.
  }
  return [...FREQUENT_CURRENCIES];
}

function createCurrencyDisplayNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" });
  } catch {
    return null;
  }
}

function getCurrencyName(
  code: string,
  displayNames: Intl.DisplayNames | null,
): string {
  try {
    const name = displayNames?.of(code);
    return name && name !== code ? name : "";
  } catch {
    return "";
  }
}

function formatCurrencyLabel(
  code: string,
  displayNames: Intl.DisplayNames | null,
): string {
  const name = getCurrencyName(code, displayNames);
  return name ? `${code} · ${name}` : code;
}

interface CurrencyComboboxProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  "aria-invalid"?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CurrencyCombobox({
  id,
  value,
  onValueChange,
  "aria-invalid": ariaInvalid,
  disabled,
  className,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allCurrencies = useMemo(() => getAllCurrencies(), []);
  const displayNames = useMemo(() => createCurrencyDisplayNames(), []);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCurrencies = useMemo(() => {
    if (!normalizedQuery) return [];
    return allCurrencies
      .filter((code) => {
        const label = formatCurrencyLabel(code, displayNames).toLowerCase();
        return label.includes(normalizedQuery);
      })
      .slice(0, 40);
  }, [allCurrencies, displayNames, normalizedQuery]);

  const selectedLabel = value
    ? formatCurrencyLabel(value, displayNames)
    : "Select currency";

  function handleSelect(code: string) {
    onValueChange(code);
    setOpen(false);
    setQuery("");
  }

  function renderOption(code: string) {
    const label = formatCurrencyLabel(code, displayNames);
    const isSelected = code === value;
    return (
      <button
        key={code}
        type="button"
        onClick={() => handleSelect(code)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent/60 font-medium",
        )}
      >
        <span className="truncate">{label}</span>
        <Check
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground",
            isSelected ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
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
        <span className="truncate">{selectedLabel}</span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search currency..."
          aria-label="Search currency"
          autoFocus
        />
        <div className="max-h-60 space-y-1 overflow-y-auto pt-1">
          {normalizedQuery ? (
            filteredCurrencies.length > 0 ? (
              filteredCurrencies.map(renderOption)
            ) : (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No currencies found.
              </p>
            )
          ) : (
            <div>
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Frequent
              </p>
              {FREQUENT_CURRENCIES.map(renderOption)}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
