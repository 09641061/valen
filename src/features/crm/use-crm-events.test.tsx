import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCrmEvents } from "./use-crm-events";

type Listener = EventListenerOrEventListenerObject;

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readonly url: string;
  readyState: number = FakeEventSource.OPEN;
  readonly listeners = new Map<string, Set<Listener>>();
  readonly addEventListener = vi.fn((type: string, listener: Listener) => {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  });
  readonly removeEventListener = vi.fn((type: string, listener: Listener) => {
    this.listeners.get(type)?.delete(listener);
  });
  readonly close = vi.fn(() => {
    this.readyState = FakeEventSource.CLOSED;
  });

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
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(source.addEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );

    act(() => {
      source.emit("message.created");
      source.emit("conversation.updated");
    });
    expect(onEvent).toHaveBeenCalledTimes(2);

    unmount();

    expect(source.removeEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
    expect(source.close).toHaveBeenCalledTimes(1);
  });

  it("does not reopen EventSource when onEvent reference changes on re-render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(<TestSubscriber onEvent={first} />);

    expect(FakeEventSource.instances).toHaveLength(1);
    rerender(<TestSubscriber onEvent={second} />);
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => {
      FakeEventSource.instances[0].emit("message.created");
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("reconnects with backoff when EventSource closes on error and cancels timer on unmount", () => {
    const onEvent = vi.fn();
    const { unmount } = render(<TestSubscriber onEvent={onEvent} />);

    const first = FakeEventSource.instances[0];
    first.readyState = FakeEventSource.CLOSED;
    act(() => {
      first.emit("error");
    });
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(FakeEventSource.instances).toHaveLength(2);

    const second = FakeEventSource.instances[1];
    second.readyState = FakeEventSource.CLOSED;
    act(() => {
      second.emit("error");
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(FakeEventSource.instances).toHaveLength(2);
  });
});
