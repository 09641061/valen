import { NextResponse } from "next/server";
import { setAuthCookiesOnResponse } from "@/lib/auth-cookies";
import { IamApiError, loginWithPassword } from "@/features/iam/auth-api";
import { LoginSchema } from "@/features/iam/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid credentials" },
        { status: 400 },
      );
    }

    const tokens = await loginWithPassword(
      parsed.data.email,
      parsed.data.password,
    );

    const response = NextResponse.json({
      user: tokens.user ?? null,
    });
    setAuthCookiesOnResponse(response, tokens);
    return response;
  } catch (error) {
    if (error instanceof IamApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Unable to sign in" },
      { status: 500 },
    );
  }
}
