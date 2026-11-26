"use client";

import { MessageSquare } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  loadRecentConversationsAction,
  type RecentConversationOption,
} from "../actions";

interface ConversationPickerProps {
  onSelect: (option: RecentConversationOption) => void;
}

export function ConversationPicker({ onSelect }: ConversationPickerProps) {
  const [recentOptions, setRecentOptions] = useState<
    RecentConversationOption[] | null
  >(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  function handleLoad() {
    setPickerError(null);
    startTransition(async () => {
      const result = await loadRecentConversationsAction();
      if (!result.ok) {
        setPickerError(result.message);
        return;
      }
      setRecentOptions(result.data);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLoad}
        disabled={isLoading}
        className="w-full justify-center gap-2"
      >
        <MessageSquare className="size-4" />
        {isLoading ? "Loading conversations..." : "Pick from Conversations"}
      </Button>
      {pickerError ? (
        <p className="text-xs text-destructive">{pickerError}</p>
      ) : null}
      {recentOptions ? (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
          {recentOptions.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No recent conversations available.
            </p>
          ) : (
            recentOptions.map((option) => (
              <button
                key={option.conversation.id}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setRecentOptions(null);
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
              >
                <span className="font-medium">
                  {option.customer?.name ?? "Unknown contact"}
                </span>
                <span className="text-muted-foreground">
                  {option.customer?.phone ?? option.conversation.channel}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
