import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationDto, CustomerDto, MessageDto } from "../schemas";
import { CustomerProfileDialog } from "./CustomerProfileDialog";

const { loadConversationMessagesActionMock } = vi.hoisted(() => ({
  loadConversationMessagesActionMock: vi.fn(),
}));

vi.mock("../actions", () => ({
  loadConversationMessagesAction: loadConversationMessagesActionMock,
}));

const CUSTOMER: CustomerDto = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Alice Smith",
  phone: "+14155550101",
  version: 1,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

const CONVERSATIONS: ConversationDto[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    customer_id: CUSTOMER.id,
    channel: "whatsapp",
    status: "open",
    ai_paused: false,
    version: 1,
    last_message_preview: "Open thread preview",
    created_at: "2026-01-02T10:00:00Z",
    updated_at: "2026-01-02T10:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    customer_id: CUSTOMER.id,
    channel: "whatsapp",
    status: "closed",
    ai_paused: false,
    version: 2,
    last_message_preview: "Closed thread preview",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
  },
];

const OPEN_MESSAGES: MessageDto[] = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    conversation_id: CONVERSATIONS[0].id,
    direction: "inbound",
    content: "Hello from customer",
    status: "received",
    created_at: "2026-01-02T10:05:00Z",
  },
];

const CLOSED_MESSAGES: MessageDto[] = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    conversation_id: CONVERSATIONS[1].id,
    direction: "outbound",
    content: "Archived reply",
    status: "sent",
    created_at: "2026-01-01T11:00:00Z",
  },
];

describe("CustomerProfileDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders profile header, open thread messages, and switches to closed history inline", async () => {
    loadConversationMessagesActionMock.mockResolvedValueOnce({
      ok: true,
      data: CLOSED_MESSAGES,
    });
    const user = userEvent.setup();

    render(
      <CustomerProfileDialog
        open={true}
        customer={CUSTOMER}
        conversations={CONVERSATIONS}
        initialMessages={OPEN_MESSAGES}
        initialConversationId={CONVERSATIONS[0].id}
        isLoadingConversations={false}
        loadError={null}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Customers · profile")).toBeTruthy();
    expect(screen.getByText("Independent of WhatsApp")).toBeTruthy();
    expect(screen.getByText("Hello from customer")).toBeTruthy();

    await user.click(screen.getByText("Closed thread preview"));

    expect(loadConversationMessagesActionMock).toHaveBeenCalledWith(
      CONVERSATIONS[1].id,
    );
    expect(await screen.findByText("Archived reply")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
  });
});
