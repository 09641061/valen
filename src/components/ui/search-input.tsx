"use client";

import type { Ref } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel?: string;
  className?: string;
  inputClassName?: string;
  size?: "default" | "sm";
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel = "Clear search",
  className,
  inputClassName,
  size = "default",
  inputRef,
  autoFocus,
}: SearchInputProps) {
  const compact = size === "sm";

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground",
          compact ? "size-3.5" : "size-4",
        )}
      />
      <Input
        ref={inputRef}
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className={cn(
          compact ? "h-8 pr-8 pl-8 text-xs" : "pr-8 pl-9",
          inputClassName,
        )}
      />
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden="true" className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
