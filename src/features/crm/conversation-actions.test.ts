import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendConversationMessageAction,
  updateConversationAiAction,
  updateConversationStatusAction,
} from "./conversation-actions";
import {
  CrmApiError,
  sendConversationMessage,
  updateConversationAi,
  updateConversationStatus,
} from "./data-access";

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("./data-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data-access")>();
  return {
    ...actual,
    sendConversationMessage: vi.fn(),
    updateConversationAi: vi.fn(),
    updateConversationStatus: vi.fn(),
  };
});

const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const IDEMPOTENCY_KEY = "33333333-3333-4333-8333-333333333333";

const SAMPLE_MESSAGE = {
  id: "44444444-4444-4444-8444-444444444444",
  conversation_id: CONVERSATION_ID,
  direction: "outbound" as const,
  content: "Hello!",
  status: "sent" as const,
  created_at: "2026-01-02T12:00:00Z",
};

const SAMPLE_CONVERSATION = {
  id: CONVERSATION_ID,
  customer_id: "11111111-1111-4111-8111-111111111111",
  channel: "whatsapp" as const,
  status: "closed" as const,
  ai_paused: false,
  version: 4,
  last_message_at: "2026-01-02T12:00:00Z",
  last_message_preview: "Hello!",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-02T12:00:00Z",
};

describe("conversation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendConversationMessageAction", () => {
    it("returns VALIDATION_ERROR for blank message without calling API", async () => {
      const result = await sendConversationMessageAction({
        conversationId: CONVERSATION_ID,
        idempotencyKey: IDEMPOTENCY_KEY,
        content: "   ",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("VALIDATION_ERROR");
        expect(result.fieldErrors?.content).toBeDefined();
      }
      expect(sendConversationMessage).not.toHaveBeenCalled();
    });

    it("forwards Idempotency-Key and revalidates paths on success", async () => {
      vi.mocked(sendConversationMessage).mockResolvedValueOnce(SAMPLE_MESSAGE);

      const result = await sendConversationMessageAction({
        conversationId: CONVERSATION_ID,
        idempotencyKey: IDEMPOTENCY_KEY,
        content: "Hello!",
      });

      expect(result).toEqual({ ok: true, data: SAMPLE_MESSAGE });
      expect(sendConversationMessage).toHaveBeenCalledWith(
        CONVERSATION_ID,
        IDEMPOTENCY_KEY,
        "Hello!",
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/conversations");
      expect(revalidatePathMock).toHaveBeenCalledWith("/customers");
    });

    it("maps 502 CrmApiError to typed error result", async () => {
      vi.mocked(sendConversationMessage).mockRejectedValueOnce(
        new CrmApiError("UPSTREAM_ERROR", "WhatsApp gateway error (502)", 502),
      );

      const result = await sendConversationMessageAction({
        conversationId: CONVERSATION_ID,
        idempotencyKey: IDEMPOTENCY_KEY,
        content: "Hello!",
      });

      expect(result).toEqual({
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "WhatsApp gateway error (502)",
        fieldErrors: undefined,
      });
    });
  });

  describe("updateConversationStatusAction", () => {
    it("updates status and revalidates paths on success", async () => {
      vi.mocked(updateConversationStatus).mockResolvedValueOnce(
        SAMPLE_CONVERSATION,
      );

      const result = await updateConversationStatusAction({
        conversationId: CONVERSATION_ID,
        status: "closed",
      });

      expect(result).toEqual({ ok: true, data: SAMPLE_CONVERSATION });
      expect(updateConversationStatus).toHaveBeenCalledWith(
        CONVERSATION_ID,
        "closed",
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/conversations");
      expect(revalidatePathMock).toHaveBeenCalledWith("/customers");
    });

    it("maps CONFLICT error to typed result", async () => {
      vi.mocked(updateConversationStatus).mockRejectedValueOnce(
        new CrmApiError(
          "CONFLICT",
          "Conversation status conflict.",
          409,
        ),
      );

      const result = await updateConversationStatusAction({
        conversationId: CONVERSATION_ID,
        status: "closed",
      });

      expect(result).toEqual({
        ok: false,
        code: "CONFLICT",
        message: "Conversation status conflict.",
        fieldErrors: undefined,
      });
    });
  });

  describe("updateConversationAiAction", () => {
    it("forwards version and aiPaused and revalidates /conversations on success", async () => {
      vi.mocked(updateConversationAi).mockResolvedValueOnce(SAMPLE_CONVERSATION);

      const result = await updateConversationAiAction({
        conversationId: CONVERSATION_ID,
        version: 3,
        aiPaused: false,
      });

      expect(result).toEqual({ ok: true, data: SAMPLE_CONVERSATION });
      expect(updateConversationAi).toHaveBeenCalledWith(
        CONVERSATION_ID,
        3,
        false,
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/conversations");
    });

    it("returns VALIDATION_ERROR for invalid input without calling API", async () => {
      const result = await updateConversationAiAction({
        conversationId: "not-a-uuid",
        version: 0,
        aiPaused: false,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(updateConversationAi).not.toHaveBeenCalled();
    });

    it.each([
      ["STALE_VERSION", 412, "Conversation was updated by another user."],
      ["CONFLICT", 409, "Cannot resume AI on a closed conversation."],
    ] as const)(
      "propagates %s CrmApiError to typed result",
      async (code, status, message) => {
        vi.mocked(updateConversationAi).mockRejectedValueOnce(
          new CrmApiError(code, message, status),
        );

        const result = await updateConversationAiAction({
          conversationId: CONVERSATION_ID,
          version: 3,
          aiPaused: false,
        });

        expect(result).toEqual({
          ok: false,
          code,
          message,
          fieldErrors: undefined,
        });
        expect(revalidatePathMock).not.toHaveBeenCalled();
      },
    );
  });
});
