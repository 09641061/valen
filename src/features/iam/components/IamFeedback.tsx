"use client";

import type { ReactNode } from "react";
import { Info, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "./SearchInput";

export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function InfoCallout({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-accent/50 p-3.5 text-xs text-muted-foreground">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-sidebar-primary"
      />
      <p>{children}</p>
    </div>
  );
}

export function WorkspaceHeader({
  title,
  description,
  canInvite,
  onInvite,
}: {
  title: string;
  description: string;
  canInvite?: boolean;
  onInvite?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {canInvite && onInvite ? (
        <Button onClick={onInvite}>
          <UserPlus aria-hidden="true" className="mr-2 size-4" />
          Invite member
        </Button>
      ) : null}
    </div>
  );
}

export function SearchToolbar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  summary,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
  summary: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
      />
      <p className="text-xs text-muted-foreground">{summary}</p>
    </div>
  );
}

export function DialogFormFooter({
  onCancel,
  isPending,
  submitLabel,
  pendingLabel,
}: {
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}
