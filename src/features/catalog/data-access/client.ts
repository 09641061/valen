import "server-only";

import { getServerEnv } from "@/lib/env";

export type CatalogErrorCode =
  | "VALIDATION_ERROR"
  | "STALE_VERSION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UPSTREAM_ERROR";

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Typed error representing failures communicating with Cynthia's catalog API.
 */
export class CatalogApiError extends Error {
  readonly code: CatalogErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: CatalogErrorCode,
    message: string,
    status: number,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "CatalogApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function mapStatusToCode(status: number): CatalogErrorCode {
  if (status === 400 || status === 422) {
    return "VALIDATION_ERROR";
  }
  if (status === 412 || status === 428) {
    return "STALE_VERSION";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 409) {
    return "CONFLICT";
  }
  return "UPSTREAM_ERROR";
}

function normalizeFieldErrors(
  rawErrors?: Record<string, string[] | string>,
): Record<string, string[]> | undefined {
  if (!rawErrors || typeof rawErrors !== "object") {
    return undefined;
  }

  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(rawErrors)) {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) {
        normalized[key] = messages;
      }
    } else if (typeof value === "string" && value.length > 0) {
      normalized[key] = [value];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function formatIfMatchHeader(version: number): string {
  return `"v${version}"`;
}

async function parseErrorResponse(response: Response): Promise<CatalogApiError> {
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
      return new CatalogApiError(code, message, response.status, fieldErrors);
    } catch {
      // Fall through to generic status message when JSON body is malformed.
    }
  }

  return new CatalogApiError(
    code,
    `Server error (${response.status})`,
    response.status,
  );
}

export async function cynthiaFetch(
  path: string,
  init: RequestInit = {},
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
        ? `Could not connect to catalog service: ${error.message}`
        : "Could not connect to catalog service";
    throw new CatalogApiError("UPSTREAM_ERROR", message, 503);
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response;
}
