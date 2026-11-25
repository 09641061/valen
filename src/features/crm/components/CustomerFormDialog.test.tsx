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

function renderDialog(
  customer: CustomerDto | null = null,
  onOpenExistingProfile = vi.fn(),
) {
  return render(
    <CustomerFormDialog
      open={true}
      customer={customer}
      onOpenChange={vi.fn()}
      onSaved={vi.fn()}
      onOpenExistingProfile={onOpenExistingProfile}
    />,
  );
}

describe("CustomerFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("starts add mode with empty Country code (+57 placeholder) and Phone number", () => {
    renderDialog();

    const codeInput = screen.getByLabelText("Country code") as HTMLInputElement;
    const phoneInput = screen.getByLabelText("Phone number") as HTMLInputElement;

    expect(codeInput.value).toBe("");
    expect(codeInput.placeholder).toBe("+57");
    expect(phoneInput.value).toBe("");
  });

  it("pre-populates split Country code and Phone number in edit mode", () => {
    renderDialog({ ...EXISTING_CUSTOMER, phone: "+14155550101" });

    expect(
      (screen.getByLabelText("Country code") as HTMLInputElement).value,
    ).toBe("+1");
    expect(
      (screen.getByLabelText("Phone number") as HTMLInputElement).value,
    ).toBe("4155550101");
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

    renderDialog(null, onOpenExistingProfile);

    await user.type(screen.getByLabelText("Name"), "Duplicate Alice");
    await user.type(screen.getByLabelText("Country code"), "+57");
    await user.type(screen.getByLabelText("Phone number"), "3001234567");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    expect(createCustomerActionMock).toHaveBeenCalledWith({
      name: "Duplicate Alice",
      phone: "+573001234567",
    });
    expect(
      await screen.findByText("A customer with this phone already exists"),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Open profile" }));
    expect(onOpenExistingProfile).toHaveBeenCalledWith(EXISTING_CUSTOMER);
  });

  it("loads recent conversations and splits phone when picked", async () => {
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

    renderDialog();

    await user.click(
      screen.getByRole("button", { name: "Pick from Conversations" }),
    );
    await user.click(await screen.findByText("Existing Alice"));

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Existing Alice",
    );
    expect(
      (screen.getByLabelText("Country code") as HTMLInputElement).value,
    ).toBe("+57");
    expect(
      (screen.getByLabelText("Phone number") as HTMLInputElement).value,
    ).toBe("3001234567");
  });

  it("splits pasted full E.164 phone from either Country code or Phone number", async () => {
    const user = userEvent.setup();
    renderDialog();

    const codeInput = screen.getByLabelText("Country code") as HTMLInputElement;
    const phoneInput = screen.getByLabelText("Phone number") as HTMLInputElement;

    await user.click(codeInput);
    await user.paste("+573001234567");
    expect(codeInput.value).toBe("+57");
    expect(phoneInput.value).toBe("3001234567");

    await user.clear(codeInput);
    await user.clear(phoneInput);
    await user.click(phoneInput);
    await user.paste("+14155550101");
    expect(codeInput.value).toBe("+1");
    expect(phoneInput.value).toBe("4155550101");
  });

  it("normalizes typed non-digits in Phone number", async () => {
    const user = userEvent.setup();
    renderDialog();

    const phoneInput = screen.getByLabelText("Phone number") as HTMLInputElement;
    await user.type(phoneInput, "300-abc-123");
    expect(phoneInput.value).toBe("300123");
  });

  it("shows alert when Country code is empty and clears errors/409 banner on edit", async () => {
    createCustomerActionMock.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Phone already exists",
      existingCustomer: EXISTING_CUSTOMER,
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "Alice");
    await user.type(screen.getByLabelText("Phone number"), "3001234567");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Enter a country code (e.g. +57)");
    expect(createCustomerActionMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Country code"), "+57");
    expect(screen.queryByRole("alert")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add customer" }));
    expect(
      await screen.findByText("A customer with this phone already exists"),
    ).toBeTruthy();

    await user.type(screen.getByLabelText("Phone number"), "8");
    expect(
      screen.queryByText("A customer with this phone already exists"),
    ).toBeNull();
  });

  it("shows Name is required when submitting empty Name", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Country code"), "+57");
    await user.type(screen.getByLabelText("Phone number"), "3001234567");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Name is required");
    expect(createCustomerActionMock).not.toHaveBeenCalled();
  });
});
