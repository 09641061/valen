import { Lock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateGroup, formatTimestamp } from "../format";
import type { MessageDto } from "../schemas";
import { MessageMarkdown } from "./MessageMarkdown";

interface MessageThreadProps {
  messages: MessageDto[];
  isLoading?: boolean;
  isClosed?: boolean;
  emptyLabel?: string;
}

interface GroupedMessages {
  dateLabel: string;
  items: MessageDto[];
}

function groupByDate(messages: MessageDto[]): GroupedMessages[] {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const groups: GroupedMessages[] = [];
  for (const message of sorted) {
    const label = formatDateGroup(message.created_at);
    const current = groups[groups.length - 1];
    if (current && current.dateLabel === label) {
      current.items.push(message);
    } else {
      groups.push({ dateLabel: label, items: [message] });
    }
  }
  return groups;
}

export function MessageThread({
  messages,
  isLoading = false,
  isClosed = false,
  emptyLabel = "No messages in this conversation yet.",
}: MessageThreadProps) {
  const groups = groupByDate(messages);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-muted/20">
      {isClosed ? (
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Conversation archived
          </span>
          <Badge variant="secondary" className="gap-1">
            <Lock className="size-3" />
            Closed
          </Badge>
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading messages...
          </p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <MessageSquare className="mb-2 size-6 opacity-50" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.dateLabel} className="space-y-3">
              <div className="flex justify-center">
                <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                  {group.dateLabel}
                </span>
              </div>
              {group.items.map((message) => {
                const isOutbound = message.direction === "outbound";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
                        isOutbound
                          ? "rounded-br-sm bg-emerald-100 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-50"
                          : "rounded-bl-sm border bg-background text-foreground"
                      }`}
                    >
                      <MessageMarkdown content={message.content} />
                      <p
                        className={`mt-1 text-[11px] ${
                          isOutbound
                            ? "text-emerald-800/70 dark:text-emerald-200/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
