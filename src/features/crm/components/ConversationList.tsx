"use client";

import { MessageCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTimestamp } from "../format";
import type { HydratedConversation } from "../schemas";

export type ConversationStatusFilter = "all" | "open" | "closed";

interface ConversationListProps {
  conversations: HydratedConversation[];
  selectedId: string | null;
  searchQuery: string;
  statusFilter: ConversationStatusFilter;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onStatusChange: (status: ConversationStatusFilter) => void;
  onSelect: (conversationId: string) => void;
}

const STATUS_FILTERS: Array<{
  value: ConversationStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export function ConversationList({
  conversations,
  selectedId,
  searchQuery,
  statusFilter,
  onSearchChange,
  onSearchSubmit,
  onStatusChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="space-y-3 border-b p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search customer or message"
            aria-label="Search customer or message"
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-1.5" role="group" aria-label="Filter conversations by status">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => onStatusChange(filter.value)}
                className="h-7 rounded-full px-3 text-xs"
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 divide-y overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground">
            <MessageCircle className="mb-2 size-6 opacity-50" />
            <p className="text-sm font-medium text-foreground">
              No conversations found
            </p>
            <p className="mt-1 text-xs">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          conversations.map(({ conversation, customer }) => {
            const isSelected = conversation.id === selectedId;
            const customerName = customer?.name ?? "Unknown customer";
            const timestamp =
              conversation.last_message_at ?? conversation.updated_at;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                aria-current={isSelected ? "true" : undefined}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  isSelected ? "bg-muted/70" : ""
                }`}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <MessageCircle className="size-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {customerName}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatTimestamp(timestamp)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversation.last_message_preview || "No messages yet"}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge
                      variant={
                        conversation.status === "open" ? "default" : "secondary"
                      }
                      className="h-5 px-2 text-[10px] capitalize"
                    >
                      {conversation.status}
                    </Badge>
                    {conversation.ai_paused ? (
                      <Badge variant="outline" className="h-5 px-2 text-[10px]">
                        AI paused
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
