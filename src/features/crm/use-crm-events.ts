"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

type CrmEventListener = () => void;

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

const listeners = new Set<CrmEventListener>();
const eventCallbacks = new Map<symbol, () => void>();
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let eventVersion = 0;

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function detachEventSource() {
  if (!eventSource) return;
  eventSource.removeEventListener("open", handleOpen);
  eventSource.removeEventListener("error", handleError);
  eventSource.removeEventListener("message.created", notifyListeners);
  eventSource.removeEventListener("conversation.updated", notifyListeners);
  eventSource.close();
  eventSource = null;
}

function handleOpen() {
  reconnectAttempt = 0;
}

function handleError() {
  if (!eventSource || eventSource.readyState !== EventSource.CLOSED) {
    return;
  }
  detachEventSource();
  if (listeners.size === 0 || reconnectTimer !== null) {
    return;
  }
  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
    MAX_RECONNECT_DELAY_MS,
  );
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (listeners.size > 0) {
      ensureEventSource();
    }
  }, delay);
}

function notifyListeners() {
  reconnectAttempt = 0;
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
  source.addEventListener("open", handleOpen);
  source.addEventListener("error", handleError);
  source.addEventListener("message.created", notifyListeners);
  source.addEventListener("conversation.updated", notifyListeners);
  eventSource = source;
}

function teardownIfIdle() {
  if (listeners.size === 0) {
    clearReconnectTimer();
    reconnectAttempt = 0;
    detachEventSource();
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
  const [token] = useState(() => Symbol("crm-events"));
  eventCallbacks.set(token, onEvent);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = () => {
        onStoreChange();
        eventCallbacks.get(token)?.();
      };
      listeners.add(handler);
      ensureEventSource();
      return () => {
        eventCallbacks.delete(token);
        listeners.delete(handler);
        teardownIfIdle();
      };
    },
    [token],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
