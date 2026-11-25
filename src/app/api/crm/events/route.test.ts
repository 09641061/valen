import { beforeEach, describe, expect, it, vi } from "vitest";
import { openCrmEventStream } from "@/features/crm/loaders";
import { GET } from "./route";

vi.mock("@/features/crm/loaders", () => ({
  openCrmEventStream: vi.fn(),
}));

describe("GET /api/crm/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams 200 text/event-stream when upstream provides a body", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("event: message.created\ndata: {}\n\n"));
        controller.close();
      },
    });
    vi.mocked(openCrmEventStream).mockResolvedValueOnce(
      new Response(stream, { status: 200 }),
    );

    const request = new Request("http://localhost/api/crm/events");
    const response = await GET(request);

    expect(openCrmEventStream).toHaveBeenCalledWith(request.signal);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Connection")).toBe("keep-alive");
    expect(await response.text()).toContain("event: message.created");
  });

  it("returns 502 when upstream response has no body", async () => {
    vi.mocked(openCrmEventStream).mockResolvedValueOnce(
      new Response(null, { status: 200 }),
    );

    const response = await GET(new Request("http://localhost/api/crm/events"));

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("Event stream unavailable");
  });

  it("returns 502 when upstream throws", async () => {
    vi.mocked(openCrmEventStream).mockRejectedValueOnce(
      new Error("upstream down"),
    );

    const response = await GET(new Request("http://localhost/api/crm/events"));

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("Unable to connect to CRM event stream");
  });
});
