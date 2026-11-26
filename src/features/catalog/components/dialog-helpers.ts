import type { z } from "zod";

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
