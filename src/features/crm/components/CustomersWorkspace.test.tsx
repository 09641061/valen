import { act, cleanup, render, screen } from "@testing-library/react";
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
  return userEvent.setup({
    advanceTimers: (ms) => vi.advanceTimersByTime(ms),
  });
}

describe("CustomersWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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

  it("renders text search input without inline clear button and toggles Clean disabled state", async () => {
    const user = setupFakeTimerUser();
    renderWorkspace("");

    const searchInput = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    expect(searchInput.type).toBe("text");
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
    expect(searchInput.parentElement?.querySelector("button")).toBeNull();

    const cleanButton = screen.getByRole("button", {
      name: "Clean",
    }) as HTMLButtonElement;
    expect(cleanButton.disabled).toBe(true);

    await user.type(searchInput, "Bob");
    expect(cleanButton.disabled).toBe(false);
  });

  it("debounces live search for 300ms and updates pagination URL", async () => {
    const user = setupFakeTimerUser();
    renderWorkspace("");

    const searchInput = screen.getByLabelText("Search by name or phone");
    await user.type(searchInput, "Bob");
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Bob", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(replaceMock).toHaveBeenCalledWith("/customers?page=2", {
      scroll: false,
    });
  });

  it("preserves trailing space, keeps focus, and ignores stale RSC sync while typing", async () => {
    const user = setupFakeTimerUser();
    const { rerender } = renderWorkspace("");

    const searchInput = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    await user.type(searchInput, "Ana ");
    expect(searchInput.value).toBe("Ana ");
    expect(document.activeElement).toBe(searchInput);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Ana", {
      scroll: false,
    });

    await user.type(searchInput, "Maria");
    expect(searchInput.value).toBe("Ana Maria");

    rerender(
      <CustomersWorkspace
        customerPage={PAGE}
        initialQuery="Ana"
        initialSelectedCustomer={CUSTOMERS[0]}
      />,
    );
    expect(searchInput.value).toBe("Ana Maria");
    expect(document.activeElement).toBe(searchInput);
  });

  it("clears input immediately on Clean, cancels pending debounce, and keeps focus", async () => {
    const user = setupFakeTimerUser();
    renderWorkspace("Alice");

    const searchInput = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    await user.clear(searchInput);
    await user.type(searchInput, "Bob");
    expect(replaceMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Clean" }));
    expect(searchInput.value).toBe("");
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/customers", { scroll: false });
    expect(document.activeElement).toBe(searchInput);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalledWith("/customers?q=Bob", {
      scroll: false,
    });
  });

  it("flushes immediately on Enter without double-firing after 300ms", async () => {
    const user = setupFakeTimerUser();
    renderWorkspace("");

    const searchInput = screen.getByLabelText("Search by name or phone");
    await user.type(searchInput, "Bob{Enter}");

    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/customers?q=Bob", {
      scroll: false,
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(replaceMock).toHaveBeenCalledTimes(1);
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
