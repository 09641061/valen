import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerDto } from "../schemas";
import { CustomerFormDialog } from "./CustomerFormDialog";

const {
  createCustomerActionMock,
  updateCustomerActionMock,
  loadRecentConversationsActionMock,
} = vi.hoisted(() => ({
  createCustomerActionMock: vi.fn(),
  updateCustomerActionMock: vi.fn(),
  loadRecentConversationsActionMock: vi.fn(),
}));

vi.mock("../actions", () => ({
  createCustomerAction: createCustomerActionMock,
  updateCustomerAction: updateCustomerActionMock,
  loadRecentConversationsAction: loadRecentConversationsActionMock,
}));

const EXISTING_CUSTOMER: CustomerDto = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Existing Alice",
  phone: "+573001234567",
  version: 1,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

describe("CustomerFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays existing customer card on 409 conflict and opens profile", async () => {
    createCustomerActionMock.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Phone already exists",
      existingCustomer: EXISTING_CUSTOMER,
    });
    const onOpenExistingProfile = vi.fn();
    const user = userEvent.setup();

    render(
      <CustomerFormDialog
        open={true}
        customer={null}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onOpenExistingProfile={onOpenExistingProfile}
      />,
    );

    await user.type(screen.getByLabelText("Name"), "Duplicate Alice");
    await user.type(screen.getByLabelText("Phone"), "+573001234567");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    expect(
      await screen.findByText("A customer with this phone already exists"),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Open profile" }));
    expect(onOpenExistingProfile).toHaveBeenCalledWith(EXISTING_CUSTOMER);
  });

  it("loads recent conversations and fills form when picked", async () => {
    loadRecentConversationsActionMock.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          conversation: {
            id: "22222222-2222-4222-8222-222222222222",
            customer_id: EXISTING_CUSTOMER.id,
            channel: "whatsapp",
            status: "open",
            version: 1,
            created_at: "2026-01-01T10:00:00Z",
            updated_at: "2026-01-01T10:00:00Z",
          },
          customer: EXISTING_CUSTOMER,
        },
      ],
    });
    const user = userEvent.setup();

    render(
      <CustomerFormDialog
        open={true}
        customer={null}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onOpenExistingProfile={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Pick from Conversations" }),
    );
    await user.click(await screen.findByText("Existing Alice"));

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Existing Alice",
    );
    expect((screen.getByLabelText("Phone") as HTMLInputElement).value).toBe(
      "+573001234567",
    );
  });
});
