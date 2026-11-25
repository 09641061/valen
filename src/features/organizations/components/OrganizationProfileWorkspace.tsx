"use client";

import { useState } from "react";
import type { OrganizationDto } from "../schemas";
import { AiInstructionsCard } from "./AiInstructionsCard";
import { BusinessDetailsCard } from "./BusinessDetailsCard";
import { BusinessHoursCard } from "./BusinessHoursCard";
import { WhatsAppIntegrationCard } from "./WhatsAppIntegrationCard";

interface OrganizationProfileWorkspaceProps {
  initialOrganization: OrganizationDto;
}

export function OrganizationProfileWorkspace({
  initialOrganization,
}: OrganizationProfileWorkspaceProps) {
  const [organization, setOrganization] = useState(initialOrganization);

  function handleUpdated(next: OrganizationDto) {
    setOrganization(next);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-6">
          <BusinessDetailsCard
            organization={organization}
            onUpdated={handleUpdated}
          />
          <BusinessHoursCard
            organization={organization}
            onUpdated={handleUpdated}
          />
        </div>

        <div className="flex flex-col gap-6">
          <WhatsAppIntegrationCard
            organization={organization}
            onUpdated={handleUpdated}
          />
          <AiInstructionsCard
            organization={organization}
            onUpdated={handleUpdated}
          />
        </div>
      </div>
    </div>
  );
}
