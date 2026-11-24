"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrganizationFormCardProps {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  submitLabel: string;
  isPending: boolean;
  errorMessage: string | null;
  savedMessage: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function OrganizationFormCard({
  title,
  description,
  headerAction,
  submitLabel,
  isPending,
  errorMessage,
  savedMessage,
  onSubmit,
  className,
  contentClassName,
  children,
}: OrganizationFormCardProps) {
  return (
    <Card className={className}>
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
          {headerAction ? <CardAction>{headerAction}</CardAction> : null}
        </CardHeader>

        <CardContent className={contentClassName}>
          {children}
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-auto justify-between gap-3 pt-3">
          <div className="min-h-5 text-sm">
            {savedMessage ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-accent-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {savedMessage}
              </span>
            ) : null}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
