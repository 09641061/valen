import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookiesOnResponse,
  requestRefreshTokens,
  setAuthCookiesOnResponse,
} from "@/lib/auth-cookies";
import { getServerEnv } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/calendar",
  "/catalog",
  "/conversations",
  "/customers",
  "/organization",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToLogin(request: NextRequest, clearCookies = false): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  if (clearCookies) {
    clearAuthCookiesOnResponse(response);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return redirectToLogin(request);
  }

  if (accessToken) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return redirectToLogin(request, true);
  }

  const { CYNTHIA_API_URL } = getServerEnv();
  const tokens = await requestRefreshTokens(CYNTHIA_API_URL, refreshToken);
  if (!tokens) {
    return redirectToLogin(request, true);
  }

  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token);
  request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", request.cookies.toString());

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  setAuthCookiesOnResponse(response, tokens);
  return response;
}

export const config = {
  matcher: [
    "/calendar/:path*",
    "/catalog/:path*",
    "/conversations/:path*",
    "/customers/:path*",
    "/organization/:path*",
    "/settings/:path*",
  ],
};
