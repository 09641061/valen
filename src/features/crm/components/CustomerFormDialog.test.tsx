import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const CONFLICT_RESULT = {
  ok: false as const,
  code: "CONFLICT" as const,
  message: "Phone already exists",
  existingCustomer: EXISTING_CUSTOMER,
};

const RECENT_CONVERSATION_OPTION = {
  conversation: {
    id: "22222222-2222-4222-8222-222222222222",
    customer_id: EXISTING_CUSTOMER.id,
    channel: "whatsapp" as const,
    status: "open" as const,
    version: 1,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  },
  customer: EXISTING_CUSTOMER,
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

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  fields: { name?: string; code?: string; phone?: string },
) {
  if (fields.name) await user.type(screen.getByLabelText("Name"), fields.name);
  if (fields.code) {
    await user.type(screen.getByLabelText("Country code"), fields.code);
  }
  if (fields.phone) {
    await user.type(screen.getByLabelText("Phone number"), fields.phone);
  }
  await user.click(screen.getByRole("button", { name: "Add customer" }));
}

describe("CustomerFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes add mode empty and pre-populates split phone in edit mode", () => {
    const { rerender } = renderDialog();
    expect(screen.getByLabelText("Country code")).toHaveValue("");
    expect(screen.getByLabelText("Country code")).toHaveAttribute(
      "placeholder",
      "+57",
    );
    expect(screen.getByLabelText("Phone number")).toHaveValue("");

    rerender(
      <CustomerFormDialog
        key="edit"
        open={true}
        customer={{ ...EXISTING_CUSTOMER, phone: "+14155550101" }}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        onOpenExistingProfile={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Country code")).toHaveValue("+1");
    expect(screen.getByLabelText("Phone number")).toHaveValue("4155550101");
  });

  it("displays existing customer card on 409 conflict and opens profile", async () => {
    createCustomerActionMock.mockResolvedValueOnce(CONFLICT_RESULT);
    const onOpenExistingProfile = vi.fn();
    const user = userEvent.setup();

    renderDialog(null, onOpenExistingProfile);
    await fillAndSubmit(user, {
      name: "Duplicate Alice",
      code: "+57",
      phone: "3001234567",
    });

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

  it("loads recent conversations, splits phone, and clears visible 409 banner", async () => {
    createCustomerActionMock.mockResolvedValueOnce(CONFLICT_RESULT);
    loadRecentConversationsActionMock.mockResolvedValue({
      ok: true,
      data: [RECENT_CONVERSATION_OPTION],
    });
    const user = userEvent.setup();
    renderDialog();

    await fillAndSubmit(user, { name: "Alice", code: "+57", phone: "3001234567" });
    expect(
      await screen.findByText("A customer with this phone already exists"),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Pick from Conversations" }),
    );
    await user.click(await screen.findByText("Existing Alice"));

    expect(screen.getByLabelText("Name")).toHaveValue("Existing Alice");
    expect(screen.getByLabelText("Country code")).toHaveValue("+57");
    expect(screen.getByLabelText("Phone number")).toHaveValue("3001234567");
    expect(
      screen.queryByText("A customer with this phone already exists"),
    ).toBeNull();
  });

  it("splits pasted full E.164 phone and normalizes typed local digits", async () => {
    const user = userEvent.setup();
    renderDialog();
    const codeInput = screen.getByLabelText("Country code");
    const phoneInput = screen.getByLabelText("Phone number");

    await user.click(codeInput);
    await user.paste("+573001234567");
    expect(codeInput).toHaveValue("+57");
    expect(phoneInput).toHaveValue("3001234567");

    await user.clear(codeInput);
    await user.clear(phoneInput);
    await user.click(phoneInput);
    await user.paste("+14155550101");
    expect(codeInput).toHaveValue("+1");
    expect(phoneInput).toHaveValue("4155550101");

    await user.clear(phoneInput);
    await user.type(phoneInput, "300-abc-123");
    expect(phoneInput).toHaveValue("300123");
  });

  it("shows alert when Country code is empty and clears errors/409 banner on edit", async () => {
    createCustomerActionMock.mockResolvedValueOnce(CONFLICT_RESULT);
    const user = userEvent.setup();
    renderDialog();

    await fillAndSubmit(user, { name: "Alice", phone: "3001234567" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a country code (e.g. +57)",
    );
    expect(createCustomerActionMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Country code"), "+57");
    expect(screen.queryByRole("alert")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add customer" }));
    expect(
      await screen.findByText("A customer with this phone already exists"),
    ).toBeTruthy();

    await expect(screen.getByLabelText("Phone number")).toBeEnabled();
    await user.type(screen.getByLabelText("Phone number"), "8");
    expect(
      screen.queryByText("A customer with this phone already exists"),
    ).toBeNull();
  });

  it("shows Name is required with aria-describedby when Name is empty", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillAndSubmit(user, { code: "+57", phone: "3001234567" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required",
    );
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-describedby",
      "customer-name-error",
    );
    expect(createCustomerActionMock).not.toHaveBeenCalled();
  });

  it("shows server fieldErrors.phone under Phone number and clears on edit", async () => {
    createCustomerActionMock.mockResolvedValue({
      ok: false,
      code: "VALIDATION",
      message: "Invalid input",
      fieldErrors: { phone: ["Phone must be valid E.164"] },
    });
    const user = userEvent.setup();
    renderDialog();

    await fillAndSubmit(user, { name: "Alice", code: "+57", phone: "3001234567" });
    expect(await screen.findByText("Phone must be valid E.164")).toBeTruthy();

    await expect(screen.getByLabelText("Country code")).toBeEnabled();
    await user.type(screen.getByLabelText("Country code"), "1");
    expect(screen.queryByText("Phone must be valid E.164")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add customer" }));
    expect(await screen.findByText("Phone must be valid E.164")).toBeTruthy();
    await expect(screen.getByLabelText("Phone number")).toBeEnabled();
    await user.type(screen.getByLabelText("Phone number"), "8");
    expect(screen.queryByText("Phone must be valid E.164")).toBeNull();
  });
});
