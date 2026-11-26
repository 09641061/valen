import { ConversationsWorkspace } from "@/features/crm/components/ConversationsWorkspace";
import type { ConversationStatusFilter } from "@/features/crm/components/ConversationList";
import {
  getConversationMessages,
  getConversations,
  hydrateConversationsWithCustomers,
} from "@/features/crm/loaders";
import type { HydratedConversation, MessageDto } from "@/features/crm/schemas";

export const dynamic = "force-dynamic";

interface ConversationsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    conversationId?: string | string[];
  }>;
}

function firstString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseStatus(raw: string): ConversationStatusFilter {
  if (raw === "open" || raw === "closed") return raw;
  return "all";
}

function pickSelectedConversation(
  hydrated: HydratedConversation[],
  requestedId: string,
): HydratedConversation | null {
  if (requestedId) {
    const match = hydrated.find(
      (entry) => entry.conversation.id === requestedId,
    );
    if (match) return match;
  }
  return hydrated[0] ?? null;
}

async function loadInboxState(
  q: string,
  status: ConversationStatusFilter,
  requestedId: string,
): Promise<{
  hydrated: HydratedConversation[];
  selectedId: string | null;
  initialMessages: MessageDto[];
  loadError: string | null;
}> {
  try {
    const page = await getConversations({
      q: q || undefined,
      status,
      page: 1,
      pageSize: 50,
    });
    const hydrated = await hydrateConversationsWithCustomers(page.items);
    const selected = pickSelectedConversation(hydrated, requestedId);
    const initialMessages = selected
      ? await getConversationMessages(selected.conversation.id, 100)
      : [];
    return {
      hydrated,
      selectedId: selected?.conversation.id ?? null,
      initialMessages,
      loadError: null,
    };
  } catch (error) {
    console.error("[ConversationsPage] Failed to load inbox state:", error);
    return {
      hydrated: [],
      selectedId: null,
      initialMessages: [],
      loadError: "Unable to load conversations right now. Please try again.",
    };
  }
}

export default async function ConversationsPage({
  searchParams,
}: ConversationsPageProps) {
  const resolved = await searchParams;
  const q = firstString(resolved.q).trim();
  const status = parseStatus(firstString(resolved.status).trim());
  const requestedId = firstString(resolved.conversationId).trim();

  const { hydrated, selectedId, initialMessages, loadError } =
    await loadInboxState(q, status, requestedId);

  return (
    <div className="space-y-4">
      {loadError ? (
        <div
          role="alert"
          className="mx-auto mt-4 max-w-6xl rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      ) : null}
      <ConversationsWorkspace
        conversations={hydrated}
        selectedConversationId={selectedId}
        initialMessages={initialMessages}
        initialQuery={q}
        initialStatus={status}
      />
    </div>
  );
}
