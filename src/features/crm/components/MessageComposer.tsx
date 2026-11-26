"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendConversationMessageAction } from "../conversation-actions";
import type { MessageDto } from "../schemas";

interface MessageComposerProps {
  conversationId: string;
  isClosed: boolean;
  onMessageSent: (message: MessageDto) => void;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function MessageComposer({
  conversationId,
  isClosed,
  onMessageSent,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const idempotencyKeyRef = useRef<string>(createIdempotencyKey());

  function handleChange(value: string) {
    setContent(value);
    setErrorMessage(null);
    idempotencyKeyRef.current = createIdempotencyKey();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isClosed || isPending) return;

    setErrorMessage(null);
    const idempotencyKey = idempotencyKeyRef.current;

    startTransition(async () => {
      const result = await sendConversationMessageAction({
        conversationId,
        idempotencyKey,
        content: trimmed,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setContent("");
      idempotencyKeyRef.current = createIdempotencyKey();
      onMessageSent(result.data);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 border-t bg-background p-4"
    >
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(event) => handleChange(event.target.value)}
          disabled={isClosed || isPending}
          placeholder={
            isClosed
              ? "Reopen this conversation to send a reply"
              : "Write a reply..."
          }
          aria-label="Write a reply"
          rows={2}
          className="min-h-11 resize-none"
        />
        <Button
          type="submit"
          disabled={isClosed || isPending || content.trim().length === 0}
          className="shrink-0 gap-1.5"
        >
          <Send className="size-4" />
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
