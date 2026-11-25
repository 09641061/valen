import { describe, expect, it } from "vitest";
import {
  ConversationPageSchema,
  CreateCustomerSchema,
  CustomerPageSchema,
  MessageListSchema,
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
});
