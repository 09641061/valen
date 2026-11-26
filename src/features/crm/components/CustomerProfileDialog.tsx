"use client";

import { Lock, MessageSquare, Phone } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadConversationMessagesAction } from "../actions";
import { formatDateGroup, getInitials } from "../format";
import type { ConversationDto, CustomerDto, MessageDto } from "../schemas";
import { MessageThread } from "./MessageThread";

interface CustomerProfileDialogProps {
  open: boolean;
  customer: CustomerDto | null;
  conversations: ConversationDto[];
  initialMessages: MessageDto[];
  initialConversationId: string | null;
  isLoadingConversations: boolean;
  loadError: string | null;
  onOpenChange: (open: boolean) => void;
}

interface ConversationListSectionProps {
  title: string;
  emptyText: string;
  items: ConversationDto[];
  activeId: string | null;
  isClosed: boolean;
  isLoading?: boolean;
  onSelect: (conversation: ConversationDto) => void;
}

function ConversationListSection({
  title,
  emptyText,
  items,
  activeId,
  isClosed,
  isLoading = false,
  onSelect,
}: ConversationListSectionProps) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading conversations...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        items.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className={`w-full rounded-lg border p-2.5 text-left text-xs transition-colors ${
              conv.id === activeId
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-medium capitalize">
                {isClosed ? (
                  <Lock className="size-3 text-muted-foreground" />
                ) : (
                  <MessageSquare className="size-3.5 text-emerald-600" />
                )}
                {conv.channel}
              </span>
              {isClosed ? (
                <span className="text-[11px] text-muted-foreground">
                  {formatDateGroup(conv.last_message_at ?? conv.updated_at)}
                </span>
              ) : (
                <Badge variant="secondary">Open</Badge>
              )}
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {conv.last_message_preview ||
                (isClosed ? "Closed conversation" : "No messages yet")}
            </p>
          </button>
        ))
      )}
    </section>
  );
}

function ProfileMessagesPane({
  messages,
  messagesError,
  isLoading,
  activeConversation,
}: {
  messages: MessageDto[];
  messagesError: string | null;
  isLoading: boolean;
  activeConversation: ConversationDto | null;
}) {
  if (messagesError) {
    return (
      <p className="p-4 text-sm text-destructive" role="alert">
        {messagesError}
      </p>
    );
  }
  return (
    <MessageThread
      messages={messages}
      isLoading={isLoading}
      isClosed={activeConversation?.status === "closed"}
      emptyLabel={
        activeConversation
          ? "No messages in this conversation yet."
          : "Select a conversation to view messages."
      }
    />
  );
}

export function CustomerProfileDialog({
  open,
  customer,
  conversations,
  initialMessages,
  initialConversationId,
  isLoadingConversations,
  loadError,
  onOpenChange,
}: CustomerProfileDialogProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const msgReqRef = useRef(0);
  const [isLoadingMessages, startTransition] = useTransition();

  if (!customer) return null;

  const activeId =
    selectedConversationId ??
    initialConversationId ??
    conversations[0]?.id ??
    null;
  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;
  const openThreads = conversations.filter((c) => c.status === "open");
  const closedThreads = conversations.filter((c) => c.status === "closed");

  function handleSelectConversation(conversation: ConversationDto) {
    const reqId = ++msgReqRef.current;
    setSelectedConversationId(conversation.id);
    setMessagesError(null);
    startTransition(async () => {
      const result = await loadConversationMessagesAction(conversation.id);
      if (msgReqRef.current !== reqId) return;
      if (!result.ok) {
        setMessagesError(result.message);
        setMessages([]);
        return;
      }
      setMessages(result.data);
    });
  }

  const displayedMessages =
    selectedConversationId === null ? initialMessages : messages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader className="border-b pb-4">
          <p className="text-xs font-medium text-muted-foreground">
            Customers · profile
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="truncate text-lg">
                  {customer.name}
                </DialogTitle>
                <Badge variant="outline">Independent of WhatsApp</Badge>
              </div>
              <DialogDescription className="mt-0.5 flex items-center gap-1.5">
                <Phone className="size-3.5" />
                <span>{customer.phone}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadError ? (
          <p className="py-4 text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : (
          <div className="grid min-h-[380px] flex-1 grid-cols-1 gap-4 overflow-hidden pt-2 md:grid-cols-[260px_1fr]">
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              <ConversationListSection
                title="Conversations"
                emptyText="No open conversations."
                items={openThreads}
                activeId={activeId}
                isClosed={false}
                isLoading={isLoadingConversations}
                onSelect={handleSelectConversation}
              />
              <ConversationListSection
                title="History"
                emptyText="No closed conversations."
                items={closedThreads}
                activeId={activeId}
                isClosed={true}
                onSelect={handleSelectConversation}
              />
            </div>

            <div className="min-h-[320px] overflow-hidden">
              <ProfileMessagesPane
                messages={displayedMessages}
                messagesError={messagesError}
                isLoading={isLoadingConversations || isLoadingMessages}
                activeConversation={activeConversation}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
