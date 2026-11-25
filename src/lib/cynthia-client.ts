import "server-only";

import { getServerEnv } from "@/lib/env";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "STALE_VERSION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UPSTREAM_ERROR";

export interface ProblemField {
  field?: string;
  reason?: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: ProblemField[] | Record<string, string[] | string>;
  existing_customer?: unknown;
}

/**
 * Typed error representing failures communicating with Cynthia's REST API.
 */
export class CynthiaApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly existingCustomer?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    fieldErrors?: Record<string, string[]>,
    existingCustomer?: unknown,
  ) {
    super(message);
    this.name = "CynthiaApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.existingCustomer = existingCustomer;
  }
}

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 412 || status === 428) return "STALE_VERSION";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  return "UPSTREAM_ERROR";
}

function normalizeArrayErrors(
  rawErrors: ProblemField[],
): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};
  for (const entry of rawErrors) {
    if (entry.field && entry.reason) {
      normalized[entry.field] = [
        ...(normalized[entry.field] ?? []),
        entry.reason,
      ];
    }
  }
  return normalized;
}

function normalizeRecordErrors(
  rawErrors: Record<string, string[] | string>,
): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(rawErrors)) {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) normalized[key] = messages;
    } else if (typeof value === "string" && value.length > 0) {
      normalized[key] = [value];
    }
  }
  return normalized;
}

function normalizeFieldErrors(
  rawErrors?: ProblemDetails["errors"],
): Record<string, string[]> | undefined {
  if (!rawErrors || typeof rawErrors !== "object") return undefined;
  const normalized = Array.isArray(rawErrors)
    ? normalizeArrayErrors(rawErrors)
    : normalizeRecordErrors(rawErrors);
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function formatIfMatchHeader(version: number): string {
  return `"v${version}"`;
}

async function parseErrorResponse(
  response: Response,
  errorName = "CynthiaApiError",
): Promise<CynthiaApiError> {
  const code = mapStatusToCode(response.status);
  const contentType = response.headers.get("content-type") ?? "";

  if (
    contentType.includes("application/problem+json") ||
    contentType.includes("application/json")
  ) {
    try {
      const problem = (await response.json()) as ProblemDetails;
      const message =
        problem.detail || problem.title || `Server error (${response.status})`;
      const fieldErrors = normalizeFieldErrors(problem.errors);
      const existingCustomer =
        response.status === 409 ? problem.existing_customer : undefined;
      const err = new CynthiaApiError(
        code,
        message,
        response.status,
        fieldErrors,
        existingCustomer,
      );
      err.name = errorName;
      return err;
    } catch {
      // Fall through to generic status message when JSON body is malformed.
    }
  }

  const err = new CynthiaApiError(
    code,
    `Server error (${response.status})`,
    response.status,
  );
  err.name = errorName;
  return err;
}

export async function cynthiaFetch(
  path: string,
  init: RequestInit = {},
  errorName = "CynthiaApiError",
): Promise<Response> {
  const { CYNTHIA_API_URL } = getServerEnv();
  const url = new URL(path, CYNTHIA_API_URL).toString();

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json, application/problem+json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Could not connect to backend service: ${error.message}`
        : "Could not connect to backend service";
    const err = new CynthiaApiError("UPSTREAM_ERROR", message, 503);
    err.name = errorName;
    throw err;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, errorName);
  }

  return response;
}
