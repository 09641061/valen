import { openCrmEventStream } from "@/features/crm/loaders";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const upstream = await openCrmEventStream(request.signal);
    if (!upstream.body) {
      return new Response("Event stream unavailable", { status: 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Unable to connect to CRM event stream", {
      status: 502,
    });
  }
}
