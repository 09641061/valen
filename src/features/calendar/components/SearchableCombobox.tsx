"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string;
}

interface SearchableComboboxProps {
  id?: string;
  value: string;
  options: ComboboxOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

const VISIBLE_LIMIT = 50;

export function SearchableCombobox({
  id, value, options, onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled, className,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((o) =>
      (o.keywords ? `${o.label} ${o.keywords}` : o.label).toLowerCase().includes(normalizedQuery),
    );
  }, [options, normalizedQuery]);

  const visible = filtered.slice(0, VISIBLE_LIMIT);
  const hasMore = filtered.length > VISIBLE_LIMIT;

  function handleSelect(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery(""); }}>
      <PopoverTrigger
        render={
          <Button
            id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
          />
        }
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          autoFocus
        />
        <div className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">{emptyMessage}</p>
          ) : (
            visible.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/60 font-medium",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  <Check className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                </button>
              );
            })
          )}
          {hasMore && (
            <p className="px-2 py-1.5 text-center text-[11px] text-muted-foreground">
              Type to narrow results
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
