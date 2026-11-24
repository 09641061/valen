import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions";
import type { CategoryDto } from "../schemas";
import { CatalogWorkspace } from "./CatalogWorkspace";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("../actions", () => ({
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
  moveCategoryAction: vi.fn(),
  createServiceAction: vi.fn(),
  updateServiceAction: vi.fn(),
  deleteServiceAction: vi.fn(),
  moveServiceAction: vi.fn(),
}));

const CAT_ID = "11111111-1111-4111-8111-111111111111";
const SVC_ID = "22222222-2222-4222-8222-222222222222";

const sampleCategories: CategoryDto[] = [
  {
    id: CAT_ID,
    name: "Hair",
    sort_order: 1,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    services: [
      {
        id: SVC_ID,
        category_id: CAT_ID,
        name: "Classic haircut",
        duration_minutes: 45,
        price_minor_units: 2500,
        currency_code: "USD",
        sort_order: 1,
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
  },
];

describe("CatalogWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state and opens create category dialog", async () => {
    const user = userEvent.setup();
    render(<CatalogWorkspace initialCategories={[]} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Your catalog is empty" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Create first category" }),
    );

    expect(
      screen.getByRole("dialog", { name: "New category" }),
    ).toBeInTheDocument();
  });

  it("renders categories and services and filters via search", async () => {
    const user = userEvent.setup();
    render(<CatalogWorkspace initialCategories={sampleCategories} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Catalog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hair")).toBeInTheDocument();
    expect(screen.getByText("Classic haircut")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", {
      name: "Search catalog",
    });
    await user.type(searchInput, "nonexistent");

    expect(
      screen.getByRole("heading", { level: 2, name: "No results found" }),
    ).toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", {
      name: "Clear search",
    });
    await user.click(clearButtons[clearButtons.length - 1]);
    expect(screen.getByText("Classic haircut")).toBeInTheDocument();
  });

  it("validates category form and submits createCategoryAction on valid input", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.createCategoryAction).mockResolvedValue({
      ok: true,
      data: {
        ...sampleCategories[0],
        id: "33333333-3333-4333-8333-333333333333",
        name: "Barbershop",
        services: [],
      },
    });

    render(<CatalogWorkspace initialCategories={[]} />);

    await user.click(screen.getByRole("button", { name: "New category" }));
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(actions.createCategoryAction).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Category name"), "Barbershop");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    await waitFor(() => {
      expect(actions.createCategoryAction).toHaveBeenCalledWith({
        name: "Barbershop",
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("edits a category and displays STALE_VERSION reload banner on conflict", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.updateCategoryAction).mockResolvedValue({
      ok: false,
      code: "STALE_VERSION",
      message: "Category was modified by another user.",
    });

    render(<CatalogWorkspace initialCategories={sampleCategories} />);

    await user.click(
      screen.getByRole("button", { name: "Actions for category Hair" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    const nameInput = screen.getByLabelText("Category name");
    await user.clear(nameInput);
    await user.type(nameInput, "Premium Hair");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The catalog changed while you were editing",
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Category was modified by another user.",
    );

    await user.click(screen.getByRole("button", { name: "Reload catalog" }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("deletes a category via AlertDialog confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.deleteCategoryAction).mockResolvedValue({
      ok: true,
      data: null,
    });

    render(<CatalogWorkspace initialCategories={sampleCategories} />);

    await user.click(
      screen.getByRole("button", { name: "Actions for category Hair" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("alertdialog", { name: 'Delete category "Hair"?' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(actions.deleteCategoryAction).toHaveBeenCalledWith({
        id: CAT_ID,
        version: 1,
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
