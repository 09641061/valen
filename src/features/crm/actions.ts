"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  CrmApiError,
  createCustomer,
  deleteCustomer,
  fetchConversationMessages,
  fetchConversations,
  updateCustomer,
  type CrmErrorCode,
} from "./data-access";
import {
  hydrateConversationsWithCustomers,
  type HydratedConversation,
} from "./loaders";
import {
  CreateCustomerSchema,
  CustomerSchema,
  DeleteCustomerSchema,
  UpdateCustomerSchema,
  UuidSchema,
  type ConversationDto,
  type CreateCustomerInput,
  type CustomerDto,
  type DeleteCustomerInput,
  type MessageDto,
  type UpdateCustomerInput,
} from "./schemas";

export type CrmActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: CrmErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
      existingCustomer?: CustomerDto;
    };

export type RecentConversationOption = HydratedConversation;

function toActionError<T>(error: unknown): CrmActionResult<T> {
  if (error instanceof ZodError) {
    const fieldErrors = error.issues.reduce<Record<string, string[]>>(
      (acc, issue) => {
        const field = issue.path.join(".") || "form";
        acc[field] = [...(acc[field] ?? []), issue.message];
        return acc;
      },
      {},
    );
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid input",
      fieldErrors,
    };
  }

  if (error instanceof CrmApiError) {
    const parsedExisting =
      error.existingCustomer !== undefined
        ? CustomerSchema.safeParse(error.existingCustomer)
        : null;
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
      existingCustomer: parsedExisting?.success
        ? parsedExisting.data
        : undefined,
    };
  }

  return {
    ok: false,
    code: "UPSTREAM_ERROR",
    message: "An unexpected error occurred while processing the request",
  };
}

export async function createCustomerAction(
  input: CreateCustomerInput,
): Promise<CrmActionResult<CustomerDto>> {
  try {
    const validated = CreateCustomerSchema.parse(input);
    const created = await createCustomer(validated);
    revalidatePath("/customers");
    return { ok: true, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCustomerAction(
  input: UpdateCustomerInput,
): Promise<CrmActionResult<CustomerDto>> {
  try {
    const { id, name, phone } = UpdateCustomerSchema.parse(input);
    const updated = await updateCustomer(id, { name, phone });
    revalidatePath("/customers");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCustomerAction(
  input: DeleteCustomerInput,
): Promise<CrmActionResult<null>> {
  try {
    const { id } = DeleteCustomerSchema.parse(input);
    await deleteCustomer(id);
    revalidatePath("/customers");
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function loadCustomerConversationsAction(
  customerId: string,
): Promise<CrmActionResult<ConversationDto[]>> {
  try {
    const validatedId = UuidSchema.parse(customerId);
    const page = await fetchConversations({
      customerId: validatedId,
      status: "all",
      page: 1,
      pageSize: 50,
    });
    return { ok: true, data: page.items };
  } catch (error) {
    return toActionError(error);
  }
}

export async function loadConversationMessagesAction(
  conversationId: string,
): Promise<CrmActionResult<MessageDto[]>> {
  try {
    const validatedId = UuidSchema.parse(conversationId);
    const items = await fetchConversationMessages(validatedId, 100);
    return { ok: true, data: items };
  } catch (error) {
    return toActionError(error);
  }
}

export async function loadRecentConversationsAction(): Promise<
  CrmActionResult<RecentConversationOption[]>
> {
  try {
    const page = await fetchConversations({
      status: "all",
      page: 1,
      pageSize: 20,
    });
    const options = await hydrateConversationsWithCustomers(page.items);
    return { ok: true, data: options };
  } catch (error) {
    return toActionError(error);
  }
}
