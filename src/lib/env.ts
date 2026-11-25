import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  CYNTHIA_API_URL: z
    .string()
    .trim()
    .url("CYNTHIA_API_URL must be a valid URL")
    .default("http://127.0.0.1:8081"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Returns whether auth cookies should be marked Secure based on environment.
 */
export function isSecureCookieEnv(): boolean {
  return (
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false")
  );
}

/**
 * Parses and caches server-only environment variables at runtime.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    CYNTHIA_API_URL: process.env.CYNTHIA_API_URL || undefined,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
