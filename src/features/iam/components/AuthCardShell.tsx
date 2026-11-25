import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KoduHeadIcon } from "@/components/ui/icons/kodu-head-icon";

export function AuthCardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md border-border bg-card shadow-sm">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex items-center gap-2">
          <KoduHeadIcon className="size-8" />
          <span className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            takodu
          </span>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-foreground">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
