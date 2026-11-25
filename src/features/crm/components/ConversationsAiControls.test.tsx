import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as conversationActions from "../conversation-actions";
import type { HydratedConversation } from "../schemas";
import { ConversationThreadHeader } from "./ConversationThreadHeader";
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
  updateConversationAiAction: vi.fn(),
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

const pausedOpenConversation: HydratedConversation = {
  conversation: {
    id: "22222222-2222-4222-8222-222222222222",
    customer_id: sampleCustomer.id,
    channel: "whatsapp",
    status: "open",
    ai_paused: true,
    handoff_reason: "staff_replied",
    version: 3,
    last_message_at: "2026-01-02T12:00:00Z",
    last_message_preview: "Hello there!",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-02T12:00:00Z",
  },
  customer: sampleCustomer,
};

const pausedClosedConversation: HydratedConversation = {
  conversation: {
    ...pausedOpenConversation.conversation,
    id: "33333333-3333-4333-8333-333333333333",
    status: "closed",
    version: 4,
  },
  customer: sampleCustomer,
};

describe("Conversations AI controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders alert and does not refresh when Resume AI returns STALE_VERSION", async () => {
    const user = userEvent.setup();
    vi.mocked(
      conversationActions.updateConversationAiAction,
    ).mockResolvedValueOnce({
      ok: false,
      code: "STALE_VERSION",
      message: "Conversation changed",
    });

    render(
      <ConversationsWorkspace
        conversations={[pausedOpenConversation]}
        selectedConversationId={pausedOpenConversation.conversation.id}
        initialMessages={[]}
        initialQuery=""
        initialStatus="all"
      />,
    );

    expect(
      screen.getByText("Handoff reason: Staff replied"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume AI" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Conversation changed",
      );
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows AI paused badge without Resume AI button when conversation is closed", () => {
    render(
      <ConversationsWorkspace
        conversations={[pausedClosedConversation]}
        selectedConversationId={pausedClosedConversation.conversation.id}
        initialMessages={[]}
        initialQuery=""
        initialStatus="all"
      />,
    );

    expect(screen.getAllByText("AI paused").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByRole("button", { name: "Resume AI" }),
    ).not.toBeInTheDocument();
  });

  it("shows Resuming... while AI update is in flight", () => {
    render(
      <ConversationThreadHeader
        conversation={pausedOpenConversation.conversation}
        customer={sampleCustomer}
        isUpdatingStatus={false}
        isUpdatingAi={true}
        onOpenProfile={vi.fn()}
        onToggleStatus={vi.fn()}
        onResumeAi={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Resuming..." })).toBeDisabled();
  });
});
