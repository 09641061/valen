import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { CalendarWorkspace } from "./CalendarWorkspace";

const { pushMock, refreshMock, createAppointmentActionMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  createAppointmentActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("../actions", () => ({
  createAppointmentAction: createAppointmentActionMock,
  updateAppointmentAction: vi.fn(),
  deleteAppointmentAction: vi.fn(),
}));

const PEOPLE: CalendarPersonDto[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Lucia Mendez", email: "", role_label: "Stylist", active: true },
];

const CUSTOMERS: CalendarCustomerOption[] = [
  { id: "33333333-3333-4333-8333-333333333333", name: "Valeria Soto", phone: "+525521094410" },
];

const SERVICES: CalendarServiceOption[] = [
  { id: "44444444-4444-4444-8444-444444444444", name: "Classic haircut", duration_minutes: 45 },
];

const BUSINESS_HOURS: CalendarBusinessHours = {
  monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  tuesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  wednesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  thursday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  friday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  saturday: { is_open: false, open_time: "09:00", close_time: "13:00" },
  sunday: { is_open: false, open_time: "09:00", close_time: "13:00" },
};

describe("CalendarWorkspace businessHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Closed banner and disables slot creation on closed DayView", () => {
    render(
      <CalendarWorkspace
        initialView="day"
        initialDate="2026-11-28"
        todayKey="2026-11-24"
        timezone="UTC"
        businessHours={BUSINESS_HOURS}
        people={PEOPLE}
        initialAppointments={[]}
        customers={CUSTOMERS}
        services={SERVICES}
      />,
    );

    expect(screen.getByText(/Business is closed on this day/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New appointment for Lucia Mendez at 10:00" }),
    ).not.toBeInTheDocument();
  });

  it("disables outside-hours slots on open DayView and marks closed days in Week and Month views", () => {
    const { unmount } = render(
      <CalendarWorkspace
        initialView="day"
        initialDate="2026-11-24"
        todayKey="2026-11-24"
        timezone="UTC"
        businessHours={BUSINESS_HOURS}
        people={PEOPLE}
        initialAppointments={[]}
        customers={CUSTOMERS}
        services={SERVICES}
      />,
    );

    expect(
      screen.getByRole("button", { name: "New appointment for Lucia Mendez at 10:00" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New appointment for Lucia Mendez at 18:00" }),
    ).not.toBeInTheDocument();
    unmount();

    const weekRender = render(
      <CalendarWorkspace
        initialView="week"
        initialDate="2026-11-24"
        todayKey="2026-11-24"
        timezone="UTC"
        businessHours={BUSINESS_HOURS}
        people={PEOPLE}
        initialAppointments={[]}
        customers={CUSTOMERS}
        services={SERVICES}
      />,
    );
    expect(screen.getAllByText("Closed").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByRole("button", { name: "New appointment on 2026-11-28 at 10:00" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New appointment on 2026-11-24 at 10:00" }),
    ).toBeInTheDocument();
    weekRender.unmount();

    render(
      <CalendarWorkspace
        initialView="month"
        initialDate="2026-11-24"
        todayKey="2026-11-24"
        timezone="UTC"
        businessHours={BUSINESS_HOURS}
        people={PEOPLE}
        initialAppointments={[]}
        customers={CUSTOMERS}
        services={SERVICES}
      />,
    );
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);
  });

  it("validates closed days and outside-hours times in AppointmentFormDialog and TimePickerField", async () => {
    const user = userEvent.setup();
    render(
      <CalendarWorkspace
        initialView="day"
        initialDate="2026-11-28"
        todayKey="2026-11-24"
        timezone="UTC"
        businessHours={BUSINESS_HOURS}
        people={PEOPLE}
        initialAppointments={[]}
        customers={CUSTOMERS}
        services={SERVICES}
      />,
    );

    await user.click(screen.getByRole("button", { name: "New appointment" }));
    await user.click(screen.getByRole("button", { name: "Open time picker" }));
    expect(screen.getByText("Business is closed on this day")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create appointment" }));
    expect(await screen.findByText("Outside business hours")).toBeInTheDocument();
    expect(createAppointmentActionMock).not.toHaveBeenCalled();

    const dateInput = screen.getByLabelText("Date");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-11-24");

    const timeInput = screen.getByLabelText("Time");
    await user.clear(timeInput);
    await user.type(timeInput, "08:00");
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    expect(
      await screen.findByText("Appointments must be within business hours (09:00 – 18:00)."),
    ).toBeInTheDocument();
    expect(createAppointmentActionMock).not.toHaveBeenCalled();
  });
});
