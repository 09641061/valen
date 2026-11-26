import "server-only";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  attemptTokenRefresh,
  tryGetCookieStore,
} from "@/lib/auth-cookies";
import { getServerEnv } from "@/lib/env";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STALE_VERSION"
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
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 412) return "STALE_VERSION";
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

export interface CynthiaFetchOptions {
  skipAuth?: boolean;
  allowRefresh?: boolean;
}

function buildRequestHeaders(
  init: RequestInit,
  accessToken?: string,
): Headers {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, application/problem+json");
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

async function fetchWithRefresh(
  url: string,
  baseUrl: string,
  init: RequestInit,
  headers: Headers,
  refreshToken?: string,
  allowRefresh = false,
): Promise<Response> {
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (response.status !== 401 || !allowRefresh || !refreshToken) {
    return response;
  }
  const refreshed = await attemptTokenRefresh(baseUrl, refreshToken);
  if (!refreshed) {
    return response;
  }
  headers.set("Authorization", `Bearer ${refreshed.access_token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

async function getAuthTokens(skipAuth?: boolean) {
  if (skipAuth) return { accessToken: undefined, refreshToken: undefined };
  const store = await tryGetCookieStore();
  return {
    accessToken: store?.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store?.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export async function cynthiaFetch(
  path: string,
  init: RequestInit = {},
  errorName = "CynthiaApiError",
  options: CynthiaFetchOptions = {},
): Promise<Response> {
  const { CYNTHIA_API_URL } = getServerEnv();
  const url = new URL(path, CYNTHIA_API_URL).toString();
  const { accessToken, refreshToken } = await getAuthTokens(options.skipAuth);
  const headers = buildRequestHeaders(init, accessToken);

  let response: Response;
  try {
    response = await fetchWithRefresh(
      url,
      CYNTHIA_API_URL,
      init,
      headers,
      refreshToken,
      options.allowRefresh,
    );
  } catch (error) {
    const detail =
      error instanceof Error ? `: ${error.message}` : "";
    const err = new CynthiaApiError(
      "UPSTREAM_ERROR",
      `Could not connect to backend service${detail}`,
      503,
    );
    err.name = errorName;
    throw err;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, errorName);
  }

  return response;
}
