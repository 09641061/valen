import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions";
import type { OrganizationDto } from "../schemas";
import { AiInstructionsCard } from "./AiInstructionsCard";
import { BusinessDetailsCard } from "./BusinessDetailsCard";
import { BusinessHoursCard } from "./BusinessHoursCard";

vi.mock("../actions", () => ({
  updateBusinessDetailsAction: vi.fn(),
  updateBusinessHoursAction: vi.fn(),
  updateAiInstructionsAction: vi.fn(),
}));

function makeOrganization(
  overrides: Partial<OrganizationDto> = {},
): OrganizationDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Takodu Studio",
    business_type: "salon",
    contact_email: "hello@takodu.com",
    timezone: "UTC",
    business_hours: {
      monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "18:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "18:00" },
      saturday: { is_open: false, open_time: "09:00", close_time: "14:00" },
      sunday: { is_open: false, open_time: "09:00", close_time: "14:00" },
    },
    ai_instructions: "",
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("BusinessDetailsCard", () => {
  const OriginalDateTimeFormat = Intl.DateTimeFormat;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
      ...args: Parameters<typeof Intl.DateTimeFormat>
    ) {
      const instance = new OriginalDateTimeFormat(...args);
      if (!args[1]?.timeZone) {
        vi.spyOn(instance, "resolvedOptions").mockReturnValue({
          ...instance.resolvedOptions(),
          timeZone: "America/New_York",
        });
      }
      return instance;
    } as unknown as typeof Intl.DateTimeFormat);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("omits 'Use mine' button and defaults unconfigured v1 UTC org to local timezone", () => {
    render(
      <BusinessDetailsCard
        organization={makeOrganization({ version: 1, timezone: "UTC" })}
        onUpdated={vi.fn()}
        onStaleVersion={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /use mine/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("America/New_York");
  });

  it("preserves explicit configured timezone and submits updated business details", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const updatedOrg = makeOrganization({
      version: 3,
      name: "Takodu Madrid",
      contact_email: "madrid@takodu.com",
      timezone: "Europe/Madrid",
    });
    vi.mocked(actions.updateBusinessDetailsAction).mockResolvedValue({
      ok: true,
      data: updatedOrg,
    });

    render(
      <BusinessDetailsCard
        organization={makeOrganization({ version: 2, timezone: "Europe/Madrid" })}
        onUpdated={onUpdated}
        onStaleVersion={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Europe/Madrid");

    const nameInput = screen.getByLabelText("Business name");
    await user.clear(nameInput);
    await user.type(nameInput, "Takodu Madrid");

    const emailInput = screen.getByLabelText("Contact email");
    await user.clear(emailInput);
    await user.type(emailInput, "madrid@takodu.com");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateBusinessDetailsAction).toHaveBeenCalledWith({
        version: 2,
        name: "Takodu Madrid",
        contact_email: "madrid@takodu.com",
        timezone: "Europe/Madrid",
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedOrg);
  });
});

describe("BusinessHoursCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles a day closed, updates time via TimePicker, and submits", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const baseOrg = makeOrganization({ version: 2 });
    const expectedHours = {
      ...baseOrg.business_hours,
      monday: { ...baseOrg.business_hours.monday, is_open: false },
      tuesday: { ...baseOrg.business_hours.tuesday, open_time: "08:30" },
    };
    vi.mocked(actions.updateBusinessHoursAction).mockResolvedValue({
      ok: true,
      data: { ...baseOrg, version: 3, business_hours: expectedHours },
    });

    render(
      <BusinessHoursCard
        organization={baseOrg}
        onUpdated={onUpdated}
        onStaleVersion={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("switch", { name: "Monday open" }));
    expect(
      screen.queryByLabelText("Monday opening time"),
    ).not.toBeInTheDocument();

    const tuesdayOpen = screen.getByLabelText("Tuesday opening time");
    await user.clear(tuesdayOpen);
    await user.type(tuesdayOpen, "8:30");
    await user.tab();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateBusinessHoursAction).toHaveBeenCalledWith({
        version: 2,
        business_hours: expectedHours,
      });
    });
    expect(onUpdated).toHaveBeenCalled();
  });
});

describe("AiInstructionsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits configuration status badges and saves AI instructions", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const baseOrg = makeOrganization({ version: 2, ai_instructions: "" });
    const updatedOrg = {
      ...baseOrg,
      version: 3,
      ai_instructions: "Greet customers warmly.",
    };
    vi.mocked(actions.updateAiInstructionsAction).mockResolvedValue({
      ok: true,
      data: updatedOrg,
    });

    render(
      <AiInstructionsCard
        organization={baseOrg}
        onUpdated={onUpdated}
        onStaleVersion={vi.fn()}
      />,
    );

    expect(screen.queryByText("Not configured")).not.toBeInTheDocument();
    expect(screen.queryByText("Configured")).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Assistant instructions"),
      "Greet customers warmly.",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateAiInstructionsAction).toHaveBeenCalledWith({
        version: 2,
        ai_instructions: "Greet customers warmly.",
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedOrg);
  });
});
