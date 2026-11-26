"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { CrmActionResult } from "./actions";
import {
  CrmApiError,
  sendConversationMessage,
  updateConversationAi,
  updateConversationStatus,
} from "./data-access";
import {
  SendMessageSchema,
  UpdateConversationAiSchema,
  UpdateConversationStatusSchema,
  type ConversationDto,
  type MessageDto,
  type SendMessageInput,
  type UpdateConversationAiInput,
  type UpdateConversationStatusInput,
} from "./schemas";

function formatConversationActionError<T>(error: unknown): CrmActionResult<T> {
  if (error instanceof CrmApiError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  if (error instanceof ZodError) {
    const fieldErrors = error.issues.reduce<Record<string, string[]>>(
      (map, issue) => {
        const pathKey = issue.path.join(".") || "form";
        map[pathKey] = [...(map[pathKey] ?? []), issue.message];
        return map;
      },
      {},
    );
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid conversation input",
      fieldErrors,
    };
  }
  return {
    ok: false,
    code: "UPSTREAM_ERROR",
    message: "Unable to complete conversation request",
  };
}

export async function sendConversationMessageAction(
  input: SendMessageInput,
): Promise<CrmActionResult<MessageDto>> {
  try {
    const { conversationId, idempotencyKey, content } =
      SendMessageSchema.parse(input);
    const message = await sendConversationMessage(
      conversationId,
      idempotencyKey,
      content,
    );
    revalidatePath("/conversations");
    revalidatePath("/customers");
    return { ok: true, data: message };
  } catch (error) {
    return formatConversationActionError(error);
  }
}

export async function updateConversationStatusAction(
  input: UpdateConversationStatusInput,
): Promise<CrmActionResult<ConversationDto>> {
  try {
    const { conversationId, status } =
      UpdateConversationStatusSchema.parse(input);
    const updated = await updateConversationStatus(conversationId, status);
    revalidatePath("/conversations");
    revalidatePath("/customers");
    return { ok: true, data: updated };
  } catch (error) {
    return formatConversationActionError(error);
  }
}

export async function updateConversationAiAction(
  input: UpdateConversationAiInput,
): Promise<CrmActionResult<ConversationDto>> {
  try {
    const { conversationId, aiPaused } =
      UpdateConversationAiSchema.parse(input);
    const updated = await updateConversationAi(conversationId, aiPaused);
    revalidatePath("/conversations");
    return { ok: true, data: updated };
  } catch (error) {
    return formatConversationActionError(error);
  }
}
