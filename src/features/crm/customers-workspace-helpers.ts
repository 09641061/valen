import {
  loadConversationMessagesAction,
  loadCustomerConversationsAction,
} from "./actions";
import type { ConversationDto, CustomerDto, MessageDto } from "./schemas";

export interface ProfileState {
  customer: CustomerDto;
  conversations: ConversationDto[];
  initialMessages: MessageDto[];
  initialConversationId: string | null;
  error: string | null;
}

export function buildCustomersUrl(
  baseQuery: string,
  basePage: number,
  next: { q?: string; page?: number; customerId?: string },
): string {
  const params = new URLSearchParams();
  const q = next.q !== undefined ? next.q : baseQuery;
  const page = next.page !== undefined ? next.page : basePage;
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  if (next.customerId) params.set("customerId", next.customerId);
  const qs = params.toString();
  return qs ? `/customers?${qs}` : "/customers";
}

export async function fetchProfileData(
  customer: CustomerDto,
): Promise<ProfileState> {
  const convResult = await loadCustomerConversationsAction(customer.id);
  if (!convResult.ok) {
    return {
      customer,
      conversations: [],
      initialMessages: [],
      initialConversationId: null,
      error: convResult.message,
    };
  }
  const conversations = convResult.data;
  const first =
    conversations.find((c) => c.status === "open") ?? conversations[0] ?? null;
  let initialMessages: MessageDto[] = [];
  let error: string | null = null;
  if (first) {
    const msgResult = await loadConversationMessagesAction(first.id);
    if (msgResult.ok) initialMessages = msgResult.data;
    else error = msgResult.message;
  }
  return {
    customer,
    conversations,
    initialMessages,
    initialConversationId: first?.id ?? null,
    error,
  };
}
