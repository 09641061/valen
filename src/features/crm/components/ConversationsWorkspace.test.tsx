import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as conversationActions from "../conversation-actions";
import type { HydratedConversation, MessageDto } from "../schemas";
import { ConversationsWorkspace } from "./ConversationsWorkspace";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("../conversation-actions", () => ({
  sendConversationMessageAction: vi.fn(),
  updateConversationStatusAction: vi.fn(),
}));

vi.mock("../actions", () => ({
  loadCustomerConversationsAction: vi.fn(),
  loadConversationMessagesAction: vi.fn(),
}));

const sampleCustomer = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Maria Lopez",
  phone: "+573001234567",
  version: 1,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

const openConversation: HydratedConversation = {
  conversation: {
    id: "22222222-2222-4222-8222-222222222222",
    customer_id: sampleCustomer.id,
    channel: "whatsapp",
    status: "open",
    version: 3,
    last_message_at: "2026-01-02T12:00:00Z",
    last_message_preview: "Hello there!",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-02T12:00:00Z",
  },
  customer: sampleCustomer,
};

const closedConversation: HydratedConversation = {
  conversation: {
    ...openConversation.conversation,
    id: "33333333-3333-4333-8333-333333333333",
    status: "closed",
    version: 4,
  },
  customer: sampleCustomer,
};

const sampleMessages: MessageDto[] = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    conversation_id: openConversation.conversation.id,
    direction: "inbound",
    content: "Hello there!",
    status: "received",
    created_at: "2026-01-02T12:00:00Z",
  },
];

describe("ConversationsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inbox threads and selected conversation messages", () => {
    render(
      <ConversationsWorkspace
        conversations={[openConversation]}
        selectedConversationId={openConversation.conversation.id}
        initialMessages={sampleMessages}
        initialQuery=""
        initialStatus="all"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Conversations" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Maria Lopez").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("+573001234567")).toBeInTheDocument();
    expect(screen.getAllByText("Hello there!").length).toBeGreaterThanOrEqual(1);
  });

  it("reuses the same Idempotency-Key on retry after failure and displays error", async () => {
    const user = userEvent.setup();
    vi.mocked(conversationActions.sendConversationMessageAction)
      .mockResolvedValueOnce({
        ok: false,
        code: "UPSTREAM_ERROR",
        message: "WhatsApp delivery failed (502)",
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "55555555-5555-4555-8555-555555555555",
          conversation_id: openConversation.conversation.id,
          direction: "outbound",
          content: "See you at 3pm",
          status: "sent",
          created_at: "2026-01-02T12:05:00Z",
        },
      });

    render(
      <ConversationsWorkspace
        conversations={[openConversation]}
        selectedConversationId={openConversation.conversation.id}
        initialMessages={sampleMessages}
        initialQuery=""
        initialStatus="all"
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Write a reply..."),
      "See you at 3pm",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("WhatsApp delivery failed (502)"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        conversationActions.sendConversationMessageAction,
      ).toHaveBeenCalledTimes(2);
    });

    const firstCall = vi.mocked(
      conversationActions.sendConversationMessageAction,
    ).mock.calls[0][0];
    const secondCall = vi.mocked(
      conversationActions.sendConversationMessageAction,
    ).mock.calls[1][0];
    expect(firstCall.idempotencyKey).toBe(secondCall.idempotencyKey);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("disables composer when closed and toggles conversation status", async () => {
    const user = userEvent.setup();
    vi.mocked(
      conversationActions.updateConversationStatusAction,
    ).mockResolvedValueOnce({
      ok: true,
      data: { ...closedConversation.conversation, status: "open", version: 5 },
    });

    render(
      <ConversationsWorkspace
        conversations={[closedConversation]}
        selectedConversationId={closedConversation.conversation.id}
        initialMessages={[]}
        initialQuery=""
        initialStatus="all"
      />,
    );

    expect(screen.getByLabelText("Write a reply")).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Reopen conversation" }),
    );

    await waitFor(() => {
      expect(
        conversationActions.updateConversationStatusAction,
      ).toHaveBeenCalledWith({
        conversationId: closedConversation.conversation.id,
        version: 4,
        status: "open",
      });
    });
  });

  it("navigates with status filter query param when filter pill is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConversationsWorkspace
        conversations={[openConversation]}
        selectedConversationId={openConversation.conversation.id}
        initialMessages={sampleMessages}
        initialQuery=""
        initialStatus="all"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Closed" }));
    expect(pushMock).toHaveBeenCalledWith("/conversations?status=closed");
  });
});
