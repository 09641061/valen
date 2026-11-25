import { NextResponse } from "next/server";
import { setAuthCookiesOnResponse } from "@/lib/auth-cookies";
import { IamApiError, acceptInvitation } from "@/features/iam/auth-api";
import { AcceptInviteSchema } from "@/features/iam/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AcceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const tokens = await acceptInvitation(parsed.data);
    const response = NextResponse.json(
      { user: tokens.user ?? null },
      { status: 201 },
    );
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
      { error: "Unable to accept invitation" },
      { status: 500 },
    );
  }
}
