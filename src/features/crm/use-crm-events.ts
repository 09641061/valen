"use client";

import { useCallback, useSyncExternalStore } from "react";

type CrmEventListener = () => void;

const listeners = new Set<CrmEventListener>();
let eventSource: EventSource | null = null;
let eventVersion = 0;

function notifyListeners() {
  eventVersion += 1;
  for (const listener of listeners) {
    listener();
  }
}

function ensureEventSource() {
  if (eventSource || typeof EventSource === "undefined") {
    return;
  }
  const source = new EventSource("/api/crm/events");
  source.addEventListener("message.created", notifyListeners);
  source.addEventListener("conversation.updated", notifyListeners);
  eventSource = source;
}

function teardownIfIdle() {
  if (listeners.size === 0 && eventSource) {
    eventSource.removeEventListener("message.created", notifyListeners);
    eventSource.removeEventListener("conversation.updated", notifyListeners);
    eventSource.close();
    eventSource = null;
  }
}

function getSnapshot(): number {
  return eventVersion;
}

function getServerSnapshot(): number {
  return 0;
}

/**
 * Subscribes to the CRM SSE stream via useSyncExternalStore.
 * Invokes `onEvent` whenever a `message.created` or `conversation.updated`
 * event arrives from `/api/crm/events`.
 */
export function useCrmEvents(onEvent: () => void): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = () => {
        onStoreChange();
        onEvent();
      };
      listeners.add(handler);
      ensureEventSource();
      return () => {
        listeners.delete(handler);
        teardownIfIdle();
      };
    },
    [onEvent],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
