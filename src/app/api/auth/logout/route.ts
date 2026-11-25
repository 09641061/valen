import { NextResponse } from "next/server";
import { clearAuthCookiesOnResponse } from "@/lib/auth-cookies";
import { logoutSession } from "@/features/iam/auth-api";

export async function POST() {
  try {
    await logoutSession();
  } catch {
    // Clear local session cookies even if backend session is already expired.
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookiesOnResponse(response);
  return response;
}
