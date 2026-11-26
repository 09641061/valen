import { NextResponse } from "next/server";
import { openCrmEventStream } from "@/features/crm/loaders";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const stream = await openCrmEventStream(request.signal);
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to CRM event stream" },
      { status: 502 },
    );
  }
}
