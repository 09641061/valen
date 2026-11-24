import type { z } from "zod";
import type { CatalogActionResult } from "../actions";

export function extractZodFieldErrors(error: z.ZodError): Record<string, string> {
  const nextErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!nextErrors[key]) {
      nextErrors[key] = issue.message;
    }
  }
  return nextErrors;
}

export function mapActionFieldErrors(
  fieldErrors?: Record<string, string[]>,
): Record<string, string> {
  if (!fieldErrors) return {};
  const mapped: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages[0]) {
      mapped[key] = messages[0];
    }
  }
  return mapped;
}

export function handleDialogActionFailure<T>(
  result: Extract<CatalogActionResult<T>, { ok: false }>,
  onOpenChange: (open: boolean) => void,
  onStaleVersion: (message: string) => void,
): boolean {
  if (result.code === "STALE_VERSION") {
    onOpenChange(false);
    onStaleVersion(result.message);
    return true;
  }
  return false;
}
