import "server-only";

import {
  CynthiaApiError,
  cynthiaFetch,
  formatIfMatchHeader,
  type ApiErrorCode,
} from "@/lib/cynthia-client";
import {
  ConversationPageSchema,
  ConversationSchema,
  CustomerPageSchema,
  CustomerSchema,
  MessageListSchema,
  MessageSchema,
  type ConversationDto,
  type ConversationPageDto,
  type CustomerDto,
  type CustomerPageDto,
  type MessageDto,
} from "./schemas";

export { CynthiaApiError as CrmApiError, type ApiErrorCode as CrmErrorCode };

const ERROR_NAME = "CrmApiError";

export interface FetchCustomersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchConversationsParams {
  customerId?: string;
  status?: "all" | "open" | "closed";
  q?: string;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchCustomers(
  params: FetchCustomersParams = {},
): Promise<CustomerPageDto> {
  const query = buildQuery({
    q: params.q?.trim(),
    page: params.page,
    page_size: params.pageSize,
  });
  const res = await cynthiaFetch(`/v1/customers${query}`, {}, ERROR_NAME);
  return CustomerPageSchema.parse(await res.json());
}

export async function fetchCustomer(id: string): Promise<CustomerDto> {
  const res = await cynthiaFetch(
    `/v1/customers/${encodeURIComponent(id)}`,
    {},
    ERROR_NAME,
  );
  return CustomerSchema.parse(await res.json());
}

export async function createCustomer(input: {
  name: string;
  phone: string;
}): Promise<CustomerDto> {
  const res = await cynthiaFetch(
    "/v1/customers",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    ERROR_NAME,
  );
  return CustomerSchema.parse(await res.json());
}

export async function updateCustomer(
  id: string,
  version: number,
  input: { name: string; phone: string },
): Promise<CustomerDto> {
  const res = await cynthiaFetch(
    `/v1/customers/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "If-Match": formatIfMatchHeader(version),
      },
      body: JSON.stringify(input),
    },
    ERROR_NAME,
  );
  return CustomerSchema.parse(await res.json());
}

export async function deleteCustomer(id: string): Promise<void> {
  await cynthiaFetch(
    `/v1/customers/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    ERROR_NAME,
  );
}

export async function fetchConversations(
  params: FetchConversationsParams = {},
): Promise<ConversationPageDto> {
  const query = buildQuery({
    customer_id: params.customerId,
    status: params.status,
    q: params.q?.trim(),
    page: params.page,
    page_size: params.pageSize,
  });
  const res = await cynthiaFetch(`/v1/conversations${query}`, {}, ERROR_NAME);
  return ConversationPageSchema.parse(await res.json());
}

export async function fetchConversationMessages(
  conversationId: string,
  limit = 50,
): Promise<MessageDto[]> {
  const query = buildQuery({ limit });
  const res = await cynthiaFetch(
    `/v1/conversations/${encodeURIComponent(conversationId)}/messages${query}`,
    {},
    ERROR_NAME,
  );
  return MessageListSchema.parse(await res.json()).items;
}

export async function sendConversationMessage(
  conversationId: string,
  idempotencyKey: string,
  content: string,
): Promise<MessageDto> {
  const res = await cynthiaFetch(
    `/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ content }),
    },
    ERROR_NAME,
  );
  return MessageSchema.parse(await res.json());
}

export async function updateConversationStatus(
  conversationId: string,
  version: number,
  status: "open" | "closed",
): Promise<ConversationDto> {
  const res = await cynthiaFetch(
    `/v1/conversations/${encodeURIComponent(conversationId)}/status`,
    {
      method: "PATCH",
      headers: {
        "If-Match": formatIfMatchHeader(version),
      },
      body: JSON.stringify({ status }),
    },
    ERROR_NAME,
  );
  return ConversationSchema.parse(await res.json());
}

export async function fetchCrmEventStream(
  signal?: AbortSignal,
): Promise<Response> {
  return cynthiaFetch(
    "/v1/crm/events",
    {
      headers: {
        Accept: "text/event-stream",
      },
      signal,
    },
    ERROR_NAME,
  );
}
