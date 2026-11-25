"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  updateConversationAiAction,
  updateConversationStatusAction,
} from "../conversation-actions";
import type { HydratedConversation, MessageDto } from "../schemas";
import { useCrmEvents } from "../use-crm-events";
import {
  ConversationList,
  type ConversationStatusFilter,
} from "./ConversationList";
import { ConversationThreadHeader } from "./ConversationThreadHeader";
import { CustomerProfileDialog } from "./CustomerProfileDialog";
import { MessageComposer } from "./MessageComposer";
import { MessageThread } from "./MessageThread";
import { useCustomerProfileState } from "./use-customer-profile-state";

interface ConversationsWorkspaceProps {
  conversations: HydratedConversation[];
  selectedConversationId: string | null;
  initialMessages: MessageDto[];
  initialQuery: string;
  initialStatus: ConversationStatusFilter;
}

function buildInboxUrl(
  q: string,
  status: ConversationStatusFilter,
  conversationId: string | null,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  if (conversationId) params.set("conversationId", conversationId);
  const qs = params.toString();
  return qs ? `/conversations?${qs}` : "/conversations";
}

function findSelectedEntry(
  conversations: HydratedConversation[],
  selectedId: string | null,
): HydratedConversation | null {
  return (
    conversations.find((entry) => entry.conversation.id === selectedId) ??
    conversations[0] ??
    null
  );
}

export function ConversationsWorkspace({
  conversations,
  selectedConversationId,
  initialMessages,
  initialQuery,
  initialStatus,
}: ConversationsWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, startStatusTransition] = useTransition();
  const [isUpdatingAi, startAiTransition] = useTransition();

  const handleCrmEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useCrmEvents(handleCrmEvent);

  const selectedEntry = findSelectedEntry(conversations, selectedConversationId);
  const selectedConversation = selectedEntry ? selectedEntry.conversation : null;
  const selectedCustomer = selectedEntry ? selectedEntry.customer : null;
  const activeConversationId = selectedConversation ? selectedConversation.id : null;
  const isClosed = selectedConversation?.status === "closed";

  const {
    profileOpen,
    profileConversations,
    profileLoadError,
    isLoadingProfile,
    handleOpenProfile,
    handleProfileOpenChange,
  } = useCustomerProfileState(selectedCustomer);

  function handleToggleStatus() {
    if (!selectedConversation || isUpdatingStatus) return;
    setStatusError(null);
    const nextStatus = selectedConversation.status === "open" ? "closed" : "open";

    startStatusTransition(async () => {
      const result = await updateConversationStatusAction({
        conversationId: selectedConversation.id,
        version: selectedConversation.version,
        status: nextStatus,
      });
      if (!result.ok) {
        setStatusError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function handleResumeAi() {
    if (!selectedConversation || isUpdatingAi) return;
    setStatusError(null);

    startAiTransition(async () => {
      const result = await updateConversationAiAction({
        conversationId: selectedConversation.id,
        version: selectedConversation.version,
        aiPaused: false,
      });
      if (!result.ok) {
        setStatusError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer WhatsApp threads in real time.
        </p>
      </div>

      <div className="grid min-h-[620px] gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <ConversationList
          conversations={conversations}
          selectedId={activeConversationId}
          searchQuery={searchQuery}
          statusFilter={initialStatus}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() =>
            router.push(buildInboxUrl(searchQuery.trim(), initialStatus, null))
          }
          onStatusChange={(status) =>
            router.push(buildInboxUrl(searchQuery.trim(), status, null))
          }
          onSelect={(conversationId) =>
            router.push(
              buildInboxUrl(searchQuery.trim(), initialStatus, conversationId),
            )
          }
        />

        <section className="flex flex-col overflow-hidden rounded-xl border bg-card">
          {selectedConversation ? (
            <>
              <ConversationThreadHeader
                conversation={selectedConversation}
                customer={selectedCustomer}
                isUpdatingStatus={isUpdatingStatus}
                isUpdatingAi={isUpdatingAi}
                onOpenProfile={handleOpenProfile}
                onToggleStatus={handleToggleStatus}
                onResumeAi={handleResumeAi}
              />

              {statusError ? (
                <div
                  role="alert"
                  className="mx-5 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {statusError}
                </div>
              ) : null}

              <div className="min-h-0 flex-1 p-4">
                <MessageThread
                  messages={initialMessages}
                  isClosed={isClosed}
                />
              </div>

              <MessageComposer
                key={selectedConversation.id}
                conversationId={selectedConversation.id}
                isClosed={isClosed}
                onMessageSent={() => router.refresh()}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-muted-foreground">
              <MessageSquare className="mb-3 size-8 opacity-40" />
              <p className="text-sm font-medium text-foreground">
                No conversation selected
              </p>
              <p className="mt-1 text-xs">
                Select a conversation from the inbox to view and reply to
                messages.
              </p>
            </div>
          )}
        </section>
      </div>

      {profileOpen && selectedCustomer ? (
        <CustomerProfileDialog
          key={selectedCustomer.id}
          open={profileOpen}
          customer={selectedCustomer}
          conversations={profileConversations}
          initialMessages={initialMessages}
          initialConversationId={activeConversationId}
          isLoadingConversations={isLoadingProfile}
          loadError={profileLoadError}
          onOpenChange={handleProfileOpenChange}
        />
      ) : null}
    </div>
  );
}
