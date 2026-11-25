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
        sort_order: 1,
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
  },
];

describe("Service CRUD in CatalogWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates and creates a service", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.createServiceAction).mockResolvedValue({
      ok: true,
      data: {
        ...sampleCategories[0].services[0],
        id: "44444444-4444-4444-8444-444444444444",
        name: "Beard trim",
      },
    });

    render(
      <CatalogWorkspace
        initialCategories={sampleCategories}
        currencyCode="PEN"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add service" }));
    await user.click(screen.getByRole("button", { name: "Create service" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(actions.createServiceAction).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Service name"), "Beard trim");
    const priceInput = screen.getByLabelText("Price (PEN)");
    await user.clear(priceInput);
    await user.type(priceInput, "15.50");
    await user.click(screen.getByRole("button", { name: "Create service" }));

    await waitFor(() => {
      expect(actions.createServiceAction).toHaveBeenCalledWith({
        category_id: CAT_ID,
        name: "Beard trim",
        duration_minutes: 30,
        price_minor_units: 1550,
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("edits a service and calls updateServiceAction", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.updateServiceAction).mockResolvedValue({
      ok: true,
      data: {
        ...sampleCategories[0].services[0],
        name: "Modern haircut",
        version: 2,
      },
    });

    render(<CatalogWorkspace initialCategories={sampleCategories} />);

    await user.click(
      screen.getByRole("button", { name: "Actions for Classic haircut" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    const editName = screen.getByLabelText("Service name");
    await user.clear(editName);
    await user.type(editName, "Modern haircut");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateServiceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: SVC_ID,
          version: 1,
          name: "Modern haircut",
        }),
      );
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("deletes a service via AlertDialog confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.deleteServiceAction).mockResolvedValue({
      ok: true,
      data: null,
    });

    render(<CatalogWorkspace initialCategories={sampleCategories} />);

    await user.click(
      screen.getByRole("button", { name: "Actions for Classic haircut" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("alertdialog", {
        name: 'Delete service "Classic haircut"?',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(actions.deleteServiceAction).toHaveBeenCalledWith({
        id: SVC_ID,
        version: 1,
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
