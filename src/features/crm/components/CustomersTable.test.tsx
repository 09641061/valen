import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerDto } from "../schemas";
import { CustomersTable } from "./CustomersTable";

const CUSTOMERS: CustomerDto[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alice Smith",
    phone: "+14155550101",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  },
];

function makeProps(
  overrides: Partial<React.ComponentProps<typeof CustomersTable>> = {},
): React.ComponentProps<typeof CustomersTable> {
  return {
    customers: CUSTOMERS,
    selectedCustomerId: null,
    searchQuery: "",
    page: 1,
    pageSize: 20,
    total: 25,
    isSearching: false,
    onSearchChange: vi.fn(),
    onPageChange: vi.fn(),
    onSelectCustomer: vi.fn(),
    onViewProfile: vi.fn(),
    onEditCustomer: vi.fn(),
    onDeleteCustomer: vi.fn(),
    ...overrides,
  };
}

function setupFakeTimerUser() {
  vi.stubGlobal("jest", vi);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  return userEvent.setup({
    advanceTimers: (ms) => vi.advanceTimersByTime(ms),
  });
}

describe("CustomersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders text search input without inline clear button and toggles Clean", async () => {
    const user = setupFakeTimerUser();
    render(<CustomersTable {...makeProps()} />);

    const input = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    expect(input.type).toBe("text");
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
    expect(input.parentElement?.querySelector("button")).toBeNull();

    const cleanButton = screen.getByRole("button", {
      name: "Clear",
    }) as HTMLButtonElement;
    expect(cleanButton.disabled).toBe(true);

    await user.type(input, "Bob");
    expect(cleanButton.disabled).toBe(false);
  });

  it("debounces 300ms, flushes on Enter without double-fire, and cancels on pagination/unmount", async () => {
    const user = setupFakeTimerUser();
    const onSearchChange = vi.fn();
    const onPageChange = vi.fn();
    const { unmount } = render(
      <CustomersTable {...makeProps({ onSearchChange, onPageChange })} />,
    );

    const input = screen.getByLabelText("Search by name or phone");
    await user.type(input, "Bob");
    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearchChange).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenLastCalledWith("Bob");

    await user.type(input, "{Enter}");
    expect(onSearchChange).toHaveBeenCalledTimes(2);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledTimes(2);

    await user.type(input, "by");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledTimes(2);

    await user.type(input, "2");
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledTimes(2);
  });

  it("preserves trailing space, keeps focus, and ignores stale RSC sync while typing", async () => {
    const user = setupFakeTimerUser();
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <CustomersTable {...makeProps({ onSearchChange })} />,
    );

    const input = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    await user.type(input, "Ana ");
    expect(input.value).toBe("Ana ");
    expect(document.activeElement).toBe(input);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledWith("Ana");

    await user.type(input, "Maria");
    rerender(
      <CustomersTable {...makeProps({ searchQuery: "Ana", onSearchChange })} />,
    );
    expect(input.value).toBe("Ana Maria");
    expect(document.activeElement).toBe(input);
  });

  it("clears input on Clean, returns focus, and ignores stale in-flight response", async () => {
    const user = setupFakeTimerUser();
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <CustomersTable {...makeProps({ onSearchChange })} />,
    );

    const input = screen.getByLabelText(
      "Search by name or phone",
    ) as HTMLInputElement;
    await user.type(input, "Ana");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenLastCalledWith("Ana");

    rerender(
      <CustomersTable
        {...makeProps({ searchQuery: "", isSearching: true, onSearchChange })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(onSearchChange).toHaveBeenLastCalledWith("");

    rerender(
      <CustomersTable
        {...makeProps({ searchQuery: "Ana", isSearching: true, onSearchChange })}
      />,
    );
    expect(input.value).toBe("");

    rerender(
      <CustomersTable
        {...makeProps({ searchQuery: "", isSearching: false, onSearchChange })}
      />,
    );
    expect(input.value).toBe("");

    rerender(
      <CustomersTable
        {...makeProps({ searchQuery: "Bob", isSearching: false, onSearchChange })}
      />,
    );
    expect(input.value).toBe("Bob");
  });
});
