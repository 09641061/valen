import { describe, expect, it } from "vitest";
import {
  ConversationPageSchema,
  ConversationSchema,
  CreateCustomerSchema,
  CustomerPageSchema,
  MessageListSchema,
  UpdateConversationAiSchema,
  UpdateCustomerSchema,
} from "./schemas";

describe("crm schemas", () => {
  it("normalizes whitespace and punctuation in E.164 phone numbers", () => {
    const parsed = CreateCustomerSchema.parse({
      name: "  Maria Lopez  ",
      phone: " +57 (300) 123-4567 ",
    });
    expect(parsed).toEqual({
      name: "Maria Lopez",
      phone: "+573001234567",
    });
  });

  it("rejects phone numbers missing the leading plus sign", () => {
    const result = CreateCustomerSchema.safeParse({
      name: "Maria Lopez",
      phone: "573001234567",
    });
    expect(result.success).toBe(false);
  });

  it("validates UpdateCustomerSchema", () => {
    const parsed = UpdateCustomerSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Jane Doe",
      phone: "+14155552671",
    });
    expect(parsed.name).toBe("Jane Doe");
  });

  it("parses paginated customer, conversation, and message responses", () => {
    const customerPage = CustomerPageSchema.parse({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Jane Doe",
          phone: "+14155552671",
          created_at: "2026-01-01T10:00:00Z",
          updated_at: "2026-01-01T10:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    });
    expect(customerPage.items).toHaveLength(1);

    const convPage = ConversationPageSchema.parse({
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          customer_id: "11111111-1111-4111-8111-111111111111",
          channel: "whatsapp",
          status: "open",
          version: 1,
          last_message_preview: "Hello!",
          created_at: "2026-01-01T10:00:00Z",
          updated_at: "2026-01-01T10:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    });
    expect(convPage.items[0].status).toBe("open");

    const messages = MessageListSchema.parse({
      items: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          conversation_id: "22222222-2222-4222-8222-222222222222",
          direction: "inbound",
          content: "Hello!",
          status: "received",
          created_at: "2026-01-01T10:00:00Z",
        },
      ],
    });
    expect(messages.items[0].direction).toBe("inbound");
  });

  it("defaults ai_paused to false and parses optional handoff_reason on ConversationSchema", () => {
    const base = {
      id: "22222222-2222-4222-8222-222222222222",
      customer_id: "11111111-1111-4111-8111-111111111111",
      channel: "whatsapp",
      status: "open",
      version: 1,
      created_at: "2026-01-01T10:00:00Z",
      updated_at: "2026-01-01T10:00:00Z",
    };

    const defaulted = ConversationSchema.parse(base);
    expect(defaulted.ai_paused).toBe(false);
    expect(defaulted.handoff_reason).toBeUndefined();

    const paused = ConversationSchema.parse({
      ...base,
      ai_paused: true,
      handoff_reason: "staff_replied",
    });
    expect(paused.ai_paused).toBe(true);
    expect(paused.handoff_reason).toBe("staff_replied");
  });

  it("validates UpdateConversationAiSchema boundaries", () => {
    const valid = UpdateConversationAiSchema.safeParse({
      conversationId: "22222222-2222-4222-8222-222222222222",
      version: 1,
      aiPaused: false,
    });
    expect(valid.success).toBe(true);

    expect(
      UpdateConversationAiSchema.safeParse({
        conversationId: "not-a-uuid",
        version: 1,
        aiPaused: false,
      }).success,
    ).toBe(false);

    expect(
      UpdateConversationAiSchema.safeParse({
        conversationId: "22222222-2222-4222-8222-222222222222",
        version: 0,
        aiPaused: false,
      }).success,
    ).toBe(false);

    expect(
      UpdateConversationAiSchema.safeParse({
        conversationId: "22222222-2222-4222-8222-222222222222",
        version: 1.5,
        aiPaused: false,
      }).success,
    ).toBe(false);
  });
});
