import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookiesOnResponse,
  setAuthCookiesOnResponse,
} from "@/lib/auth-cookies";
import { IamApiError, refreshSession } from "@/features/iam/auth-api";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.json(
      { error: "Missing refresh token" },
      { status: 401 },
    );
    clearAuthCookiesOnResponse(response);
    return response;
  }

  try {
    const tokens = await refreshSession(refreshToken);
    const response = NextResponse.json({ ok: true });
    setAuthCookiesOnResponse(response, tokens);
    return response;
  } catch (error) {
    const status = error instanceof IamApiError ? error.status : 401;
    const response = NextResponse.json(
      { error: "Session expired" },
      { status },
    );
    clearAuthCookiesOnResponse(response);
    return response;
  }
}
