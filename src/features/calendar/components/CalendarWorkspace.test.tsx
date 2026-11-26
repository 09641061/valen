import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppointmentDto, CalendarCustomerOption, CalendarPersonDto, CalendarServiceOption } from "../schemas";
import { CalendarWorkspace } from "./CalendarWorkspace";

const { pushMock, refreshMock, createAppointmentActionMock, updateAppointmentActionMock, deleteAppointmentActionMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  createAppointmentActionMock: vi.fn(),
  updateAppointmentActionMock: vi.fn(),
  deleteAppointmentActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, refresh: refreshMock }) }));
vi.mock("../actions", () => ({
  createAppointmentAction: createAppointmentActionMock,
  updateAppointmentAction: updateAppointmentActionMock,
  deleteAppointmentAction: deleteAppointmentActionMock,
}));

const PEOPLE: CalendarPersonDto[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Lucia Mendez", email: "", role_label: "Stylist", active: true },
  { id: "22222222-2222-4222-8222-222222222222", name: "Elena Cruz", email: "", role_label: "Colorist", active: true },
];

const CUSTOMERS: CalendarCustomerOption[] = [
  { id: "33333333-3333-4333-8333-333333333333", name: "Valeria Soto", phone: "+525521094410" },
  { id: "66666666-6666-4666-8666-666666666666", name: "Mateo Silva", phone: "+525599887766" },
];

const SERVICES: CalendarServiceOption[] = [
  { id: "44444444-4444-4444-8444-444444444444", name: "Classic haircut", duration_minutes: 45 },
];

const APPOINTMENT: AppointmentDto = {
  id: "55555555-5555-4555-8555-555555555555",
  customer_id: CUSTOMERS[0].id,
  customer_name: "Valeria Soto",
  customer_phone: CUSTOMERS[0].phone,
  service_id: SERVICES[0].id,
  service_name: "Classic haircut",
  person_id: PEOPLE[0].id,
  person_name: "Lucia Mendez",
  starts_at: "2026-11-24T09:30:00.000Z",
  ends_at: "2026-11-24T10:15:00.000Z",
  status: "confirmed",
  channel: "whatsapp",
  notes: "Prefers quiet chair",
  created_at: "2026-11-24T08:00:00Z",
  updated_at: "2026-11-24T08:00:00Z",
};

function renderWorkspace(view: "day" | "week" | "month" = "day") {
  return render(
    <CalendarWorkspace
      initialView={view} initialDate="2026-11-24" todayKey="2026-11-24" timezone="UTC"
      people={PEOPLE} initialAppointments={[APPOINTMENT]} customers={CUSTOMERS} services={SERVICES}
    />,
  );
}

describe("CalendarWorkspace", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { cleanup(); });

  it("renders Day view, navigates views, and filters people", async () => {
    const user = userEvent.setup();
    renderWorkspace("day");

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getAllByText("Lucia Mendez").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Valeria Soto").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Week" }));
    expect(pushMock).toHaveBeenCalledWith("/calendar?view=week&date=2026-11-24");

    await user.click(screen.getByRole("button", { name: /People/i }));
    const peopleSearch = screen.getByPlaceholderText("Search people...");
    await user.type(peopleSearch, "Elena");
    expect(screen.queryByRole("button", { name: "Lucia Mendez" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Elena Cruz" }));
    expect(screen.queryAllByText("Valeria Soto")).toHaveLength(0);
  });

  it("opens create dialog from empty slot and shows 409 conflict banner", async () => {
    const user = userEvent.setup();
    createAppointmentActionMock.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Lucia Mendez is already booked at 11:00",
    });

    renderWorkspace("day");
    await user.click(
      screen.getByRole("button", { name: "New appointment for Lucia Mendez at 11:00" }),
    );

    expect(screen.getByRole("heading", { name: "New appointment" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    expect(await screen.findByText("Time slot conflict")).toBeInTheDocument();
    expect(screen.getByText("Lucia Mendez is already booked at 11:00")).toBeInTheDocument();
  });

  it("opens appointment detail, updates status, and deletes appointment", async () => {
    const user = userEvent.setup();
    updateAppointmentActionMock.mockResolvedValueOnce({
      ok: true,
      data: { ...APPOINTMENT, status: "completed" },
    });
    deleteAppointmentActionMock.mockResolvedValueOnce({ ok: true, data: null });

    renderWorkspace("day");
    await user.click(screen.getAllByText("Valeria Soto")[0]);

    expect(screen.getByRole("heading", { name: "Classic haircut · Valeria Soto" })).toBeInTheDocument();
    expect(screen.getByText("Assigned to")).toBeInTheDocument();
    expect(screen.getByText("Prefers quiet chair")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(updateAppointmentActionMock).toHaveBeenCalledWith({
        id: APPOINTMENT.id,
        status: "completed",
      });
    });

    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(deleteAppointmentActionMock).toHaveBeenCalledWith({
        id: APPOINTMENT.id,
      });
    });
  });

  it("renders human-readable names instead of UUIDs and supports keyboard + visual date/time picking", async () => {
    const user = userEvent.setup();
    createAppointmentActionMock.mockResolvedValueOnce({
      ok: true,
      data: APPOINTMENT,
    });

    renderWorkspace("day");
    await user.click(screen.getAllByRole("button", { name: "New appointment" })[0]);

    expect(
      screen.getAllByText("Valeria Soto (+525521094410)").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Classic haircut · 45 min").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(CUSTOMERS[0].id)).not.toBeInTheDocument();
    expect(screen.queryByText(SERVICES[0].id)).not.toBeInTheDocument();
    expect(screen.queryByText(PEOPLE[0].id)).not.toBeInTheDocument();

    const dateInput = screen.getByLabelText("Date");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-99-99");
    await user.click(screen.getByRole("button", { name: "Create appointment" }));
    expect(await screen.findByText("Invalid date or time")).toBeInTheDocument();
    expect(createAppointmentActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Open date picker" }));
    await user.click(screen.getByRole("button", { name: "2026-11-26" }));
    await user.click(screen.getByRole("button", { name: "Open time picker" }));
    await user.click(screen.getByRole("button", { name: "14:30" }));
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    await waitFor(() => {
      expect(createAppointmentActionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          starts_at: "2026-11-26T14:30:00.000Z",
          ends_at: "2026-11-26T15:15:00.000Z",
        }),
      );
    });
  });

  it("handles empty people list gracefully in toolbar and appointment form", async () => {
    const user = userEvent.setup();
    render(
      <CalendarWorkspace
        initialView="day" initialDate="2026-11-24" todayKey="2026-11-24" timezone="UTC"
        people={[]} initialAppointments={[]} customers={CUSTOMERS} services={SERVICES}
      />,
    );

    await user.click(screen.getByRole("button", { name: /People/i }));
    expect(screen.getByText("No active team members found.")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "New appointment" })[0]);
    expect(screen.getByText(/No active team members available/i)).toBeInTheDocument();
  });

  it("supports searchable customer and person comboboxes and 1000-char notes limit", async () => {
    const user = userEvent.setup();
    createAppointmentActionMock.mockResolvedValueOnce({ ok: true, data: APPOINTMENT });

    renderWorkspace("day");
    await user.click(screen.getAllByRole("button", { name: "New appointment" })[0]);

    await user.click(screen.getByRole("combobox", { name: "Customer" }));
    await user.type(screen.getByPlaceholderText("Search customer by name or phone..."), "9988");
    await user.click(screen.getByRole("button", { name: "Mateo Silva (+525599887766)" }));

    await user.click(screen.getByRole("combobox", { name: "Person" }));
    await user.type(screen.getByPlaceholderText("Search person..."), "Elena");
    await user.click(screen.getByRole("button", { name: "Elena Cruz" }));

    const notesInput = screen.getByLabelText("Notes (optional)");
    expect(notesInput).toHaveAttribute("maxLength", "1000");
    await user.type(notesInput, "VIP");
    expect(screen.getByText("3/1000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create appointment" }));
    await waitFor(() => {
      expect(createAppointmentActionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: CUSTOMERS[1].id,
          person_id: PEOPLE[1].id,
          notes: "VIP",
        }),
      );
    });
  });

  it("renders Week and Month views", () => {
    const { unmount } = renderWorkspace("week");
    expect(screen.getAllByText("Valeria Soto").length).toBeGreaterThan(0);
    unmount();

    renderWorkspace("month");
    expect(screen.getAllByText(/Valeria Soto/).length).toBeGreaterThan(0);
  });
});
