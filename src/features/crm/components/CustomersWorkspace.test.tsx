import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerDto, CustomerPageDto } from "../schemas";
import { CustomersWorkspace } from "./CustomersWorkspace";

const { replaceMock, refreshMock, deleteCustomerActionMock } = vi.hoisted(
  () => ({
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
    deleteCustomerActionMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

vi.mock("../actions", () => ({
  createCustomerAction: vi.fn(),
  updateCustomerAction: vi.fn(),
  deleteCustomerAction: deleteCustomerActionMock,
  loadCustomerConversationsAction: vi.fn(async () => ({ ok: true, data: [] })),
  loadConversationMessagesAction: vi.fn(async () => ({ ok: true, data: [] })),
  loadRecentConversationsAction: vi.fn(async () => ({ ok: true, data: [] })),
}));

const CUSTOMERS: CustomerDto[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alice Smith",
    phone: "+14155550101",
    version: 1,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Bob Jones",
    phone: "+14155550102",
    version: 1,
    created_at: "2026-01-02T10:00:00Z",
    updated_at: "2026-01-02T10:00:00Z",
  },
];

const PAGE: CustomerPageDto = {
  items: CUSTOMERS,
  total: 25,
  page: 1,
  page_size: 20,
};

describe("CustomersWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Customers heading, table rows, and selected customer detail pane", () => {
    render(
      <CustomersWorkspace
        customerPage={PAGE}
        initialQuery=""
        initialSelectedCustomer={CUSTOMERS[0]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Bob Jones")).toBeTruthy();
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
  });

  it("updates URL searchParams on search and pagination", async () => {
    const user = userEvent.setup();
    render(
      <CustomersWorkspace
        customerPage={PAGE}
        initialQuery=""
        initialSelectedCustomer={CUSTOMERS[0]}
      />,
    );

    const searchInput = screen.getByLabelText("Search by name or phone");
    await user.type(searchInput, "Bob");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Bob");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(replaceMock).toHaveBeenCalledWith("/customers?page=2");
  });

  it("confirms and deletes a customer", async () => {
    deleteCustomerActionMock.mockResolvedValueOnce({ ok: true, data: null });
    const user = userEvent.setup();
    render(
      <CustomersWorkspace
        customerPage={PAGE}
        initialQuery=""
        initialSelectedCustomer={CUSTOMERS[0]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(deleteCustomerActionMock).toHaveBeenCalledWith({
      id: CUSTOMERS[0].id,
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("opens edit dialog from the row Actions dropdown menu", async () => {
    const user = userEvent.setup();
    render(
      <CustomersWorkspace
        customerPage={PAGE}
        initialQuery=""
        initialSelectedCustomer={CUSTOMERS[0]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Bob Jones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(
      screen.getByRole("heading", { name: "Edit customer" }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("Bob Jones")).toBeTruthy();
  });
});
