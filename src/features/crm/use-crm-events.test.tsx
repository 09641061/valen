import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCrmEvents } from "./use-crm-events";

type Listener = EventListenerOrEventListenerObject;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  readonly listeners = new Map<string, Set<Listener>>();
  readonly addEventListener = vi.fn((type: string, listener: Listener) => {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  });
  readonly removeEventListener = vi.fn((type: string, listener: Listener) => {
    this.listeners.get(type)?.delete(listener);
  });
  readonly close = vi.fn();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") {
        listener(new Event(type));
      } else {
        listener.handleEvent(new Event(type));
      }
    }
  }
}

function TestSubscriber({ onEvent }: { onEvent: () => void }) {
  const version = useCrmEvents(onEvent);
  return <div data-testid="version">{version}</div>;
}

describe("useCrmEvents", () => {
  const originalEventSource = globalThis.EventSource;

  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalEventSource) {
      globalThis.EventSource = originalEventSource;
    }
  });

  it("opens /api/crm/events, fires callback on events, and cleans up on unmount", () => {
    const onEvent = vi.fn();
    const { unmount } = render(<TestSubscriber onEvent={onEvent} />);

    expect(FakeEventSource.instances).toHaveLength(1);
    const source = FakeEventSource.instances[0];
    expect(source.url).toBe("/api/crm/events");
    expect(source.addEventListener).toHaveBeenCalledWith(
      "message.created",
      expect.any(Function),
    );
    expect(source.addEventListener).toHaveBeenCalledWith(
      "conversation.updated",
      expect.any(Function),
    );

    act(() => {
      source.emit("message.created");
    });
    expect(onEvent).toHaveBeenCalledTimes(1);

    act(() => {
      source.emit("conversation.updated");
    });
    expect(onEvent).toHaveBeenCalledTimes(2);

    unmount();

    expect(source.removeEventListener).toHaveBeenCalledWith(
      "message.created",
      expect.any(Function),
    );
    expect(source.removeEventListener).toHaveBeenCalledWith(
      "conversation.updated",
      expect.any(Function),
    );
    expect(source.close).toHaveBeenCalledTimes(1);
  });
});
