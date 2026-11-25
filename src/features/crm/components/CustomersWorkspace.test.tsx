import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerDto, CustomerPageDto } from "../schemas";
import { CustomersWorkspace } from "./CustomersWorkspace";

const { replaceMock, refreshMock, deleteCustomerActionMock, transitionState } =
  vi.hoisted(() => ({
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
    deleteCustomerActionMock: vi.fn(),
    transitionState: { holdSearchPending: false },
  }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () => {
      const [pending, start] = actual.useTransition();
      return [
        transitionState.holdSearchPending ? true : pending,
        start,
      ] as const;
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
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
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Bob Jones",
    phone: "+14155550102",
    created_at: "2026-01-02T10:00:00Z",
    updated_at: "2026-01-02T10:00:00Z",
  },
];

const PAGE: CustomerPageDto = { items: CUSTOMERS, total: 25, page: 1, page_size: 20 };

function renderWorkspace(initialQuery = "") {
  return render(
    <CustomersWorkspace
      customerPage={PAGE}
      initialQuery={initialQuery}
      initialSelectedCustomer={CUSTOMERS[0]}
    />,
  );
}

function setupFakeTimerUser() {
  vi.stubGlobal("jest", vi);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
}

describe("CustomersWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transitionState.holdSearchPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders Customers heading, table rows, and selected customer detail pane", () => {
    renderWorkspace();

    expect(
      screen.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Bob Jones")).toBeTruthy();
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
  });

  it("debounces live search and updates pagination URL", async () => {
    const user = setupFakeTimerUser();
    renderWorkspace("");

    await user.type(screen.getByLabelText("Search by name or phone"), "Bob");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Bob", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(replaceMock).toHaveBeenCalledWith("/customers?page=2", {
      scroll: false,
    });
  });

  it("allows Clean to reset URL while an earlier search is still in flight", async () => {
    transitionState.holdSearchPending = true;
    const user = setupFakeTimerUser();
    renderWorkspace("");

    await user.type(
      screen.getByLabelText("Search by name or phone"),
      "Ana{Enter}",
    );
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Ana", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(replaceMock).toHaveBeenCalledWith("/customers", { scroll: false });
  });

  it("confirms and deletes a customer", async () => {
    deleteCustomerActionMock.mockResolvedValueOnce({ ok: true, data: null });
    const user = userEvent.setup();
    renderWorkspace("");

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
    renderWorkspace("");

    await user.click(
      screen.getByRole("button", { name: "Actions for Bob Jones" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(
      screen.getByRole("heading", { name: "Edit customer" }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("Bob Jones")).toBeTruthy();
  });
});
