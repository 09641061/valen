import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions";
import type { OrganizationDto } from "../schemas";
import { WhatsAppIntegrationCard } from "./WhatsAppIntegrationCard";

vi.mock("../actions", () => ({
  updateWhatsAppConfigAction: vi.fn(),
}));

function makeOrganization(
  overrides: Partial<OrganizationDto> = {},
): OrganizationDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Takodu Studio",
    business_type: "Salon",
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
    whatsapp_phone_number: "",
    whatsapp_phone_number_id: "",
    whatsapp_enabled: false,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("WhatsAppIntegrationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disconnected state by default and connected state when enabled", () => {
    const { rerender } = render(
      <WhatsAppIntegrationCard
        organization={makeOrganization()}
        onUpdated={vi.fn()}
        onStaleVersion={vi.fn()}
      />,
    );

    expect(screen.getByText("Channels and integrations")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Business")).toBeInTheDocument();
    expect(screen.getByText("• Disconnected")).toBeInTheDocument();

    rerender(
      <WhatsAppIntegrationCard
        organization={makeOrganization({
          whatsapp_enabled: true,
          whatsapp_phone_number: "+51994356103",
          whatsapp_phone_number_id: "106540352242922",
        })}
        onUpdated={vi.fn()}
        onStaleVersion={vi.fn()}
      />,
    );

    expect(
      screen.getByText("• Connected · +51994356103"),
    ).toBeInTheDocument();
  });

  it("validates required fields when enabling WhatsApp and saves valid config", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const updatedOrg = makeOrganization({
      whatsapp_enabled: true,
      whatsapp_phone_number: "+51994356103",
      whatsapp_phone_number_id: "106540352242922",
      version: 2,
    });
    vi.mocked(actions.updateWhatsAppConfigAction).mockResolvedValueOnce({
      ok: true,
      data: updatedOrg,
    });

    render(
      <WhatsAppIntegrationCard
        organization={makeOrganization()}
        onUpdated={onUpdated}
        onStaleVersion={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Configure" }));
    await user.click(screen.getByRole("switch", { name: "Enable WhatsApp" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("WhatsApp number is required when enabled"),
    ).toBeInTheDocument();
    expect(actions.updateWhatsAppConfigAction).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText("WhatsApp number"),
      "+51 994-356-103",
    );
    await user.type(
      screen.getByLabelText("Phone Number ID"),
      "106540352242922",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateWhatsAppConfigAction).toHaveBeenCalledWith({
        version: 1,
        whatsapp_enabled: true,
        whatsapp_phone_number: "+51 994-356-103",
        whatsapp_phone_number_id: "106540352242922",
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedOrg);
  });

  it("propagates STALE_VERSION to onStaleVersion", async () => {
    const user = userEvent.setup();
    const onStaleVersion = vi.fn();
    vi.mocked(actions.updateWhatsAppConfigAction).mockResolvedValueOnce({
      ok: false,
      code: "STALE_VERSION",
      message: "Organization was updated elsewhere",
    });

    render(
      <WhatsAppIntegrationCard
        organization={makeOrganization()}
        onUpdated={vi.fn()}
        onStaleVersion={onStaleVersion}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Configure" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onStaleVersion).toHaveBeenCalledWith(
        "Organization was updated elsewhere",
      );
    });
  });
});
