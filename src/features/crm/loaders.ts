import "server-only";

import { cache } from "react";
import {
  fetchConversationMessages,
  fetchConversations,
  fetchCrmEventStream,
  fetchCustomer,
  fetchCustomers,
  type FetchConversationsParams,
  type FetchCustomersParams,
} from "./data-access";
import type {
  ConversationDto,
  ConversationPageDto,
  CustomerDto,
  CustomerPageDto,
  HydratedConversation,
  MessageDto,
} from "./schemas";

export type { HydratedConversation };

export const getCustomers = cache(
  async (params: FetchCustomersParams = {}): Promise<CustomerPageDto> => {
    return fetchCustomers(params);
  },
);

export const getCustomer = cache(
  async (id: string): Promise<CustomerDto> => {
    return fetchCustomer(id);
  },
);

export const getConversations = cache(
  async (
    params: FetchConversationsParams = {},
  ): Promise<ConversationPageDto> => {
    return fetchConversations(params);
  },
);

export const getConversationMessages = cache(
  async (conversationId: string, limit = 100): Promise<MessageDto[]> => {
    return fetchConversationMessages(conversationId, limit);
  },
);

export async function hydrateConversationsWithCustomers(
  conversations: ConversationDto[],
): Promise<HydratedConversation[]> {
  const uniqueCustomerIds = Array.from(
    new Set(conversations.map((item) => item.customer_id)),
  );
  const customerEntries = await Promise.all(
    uniqueCustomerIds.map(async (id) => {
      try {
        return [id, await fetchCustomer(id)] as const;
      } catch {
        return [id, null] as const;
      }
    }),
  );
  const customerMap = new Map<string, CustomerDto | null>(customerEntries);
  return conversations.map((conversation) => ({
    conversation,
    customer: customerMap.get(conversation.customer_id) ?? null,
  }));
}

export async function openCrmEventStream(
  signal?: AbortSignal,
): Promise<Response> {
  return fetchCrmEventStream(signal);
}
