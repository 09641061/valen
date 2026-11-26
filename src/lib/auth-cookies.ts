import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { isSecureCookieEnv } from "@/lib/env";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const REFRESH_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

function isSecureCookie(): boolean {
  return isSecureCookieEnv();
}

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isSecureCookie(),
    maxAge,
  };
}

export function setAuthCookiesOnResponse(
  response: NextResponse,
  tokens: AuthTokenPair,
): void {
  const accessMaxAge = tokens.expires_in > 0 ? tokens.expires_in : 900;
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.access_token,
    buildCookieOptions(accessMaxAge),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refresh_token,
    buildCookieOptions(REFRESH_MAX_AGE_SECONDS),
  );
}

export function clearAuthCookiesOnResponse(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", buildCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", buildCookieOptions(0));
}

export async function tryGetCookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

export async function trySetAuthCookiesInStore(
  tokens: AuthTokenPair,
): Promise<void> {
  const store = await tryGetCookieStore();
  if (!store) return;
  try {
    const accessMaxAge = tokens.expires_in > 0 ? tokens.expires_in : 900;
    store.set(
      ACCESS_TOKEN_COOKIE,
      tokens.access_token,
      buildCookieOptions(accessMaxAge),
    );
    store.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refresh_token,
      buildCookieOptions(REFRESH_MAX_AGE_SECONDS),
    );
  } catch {
    // Cookie mutation is disallowed in Server Components; route handlers/actions persist cookies.
  }
}

export async function requestRefreshTokens(
  baseUrl: string,
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  try {
    const refreshUrl = new URL("/v1/auth/refresh", baseUrl).toString();
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, application/problem+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<AuthTokenPair>;
    if (!data.access_token || !data.refresh_token) return null;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: typeof data.expires_in === "number" ? data.expires_in : 900,
    };
  } catch {
    return null;
  }
}

export async function attemptTokenRefresh(
  baseUrl: string,
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  const pair = await requestRefreshTokens(baseUrl, refreshToken);
  if (!pair) return null;
  await trySetAuthCookiesInStore(pair);
  return pair;
}
