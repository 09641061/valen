import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessDeniedCard({
  title = "Access denied",
  description = "You do not have permission to view or manage this section. Contact your workspace owner or administrator if you need access.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <ShieldAlert aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
