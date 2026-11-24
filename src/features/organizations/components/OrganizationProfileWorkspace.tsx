"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrganizationDto } from "../schemas";
import { AiInstructionsCard } from "./AiInstructionsCard";
import { BusinessDetailsCard } from "./BusinessDetailsCard";
import { BusinessHoursCard } from "./BusinessHoursCard";

interface OrganizationProfileWorkspaceProps {
  initialOrganization: OrganizationDto;
}

export function OrganizationProfileWorkspace({
  initialOrganization,
}: OrganizationProfileWorkspaceProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialOrganization);
  const [staleMessage, setStaleMessage] = useState<string | null>(null);

  function handleUpdated(next: OrganizationDto) {
    setOrganization(next);
    setStaleMessage(null);
  }

  return (
    <div className="space-y-6">
      {staleMessage ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
        >
          <p className="text-foreground">{staleMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStaleMessage(null);
              router.refresh();
            }}
          >
            Reload
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-6">
          <BusinessDetailsCard
            organization={organization}
            onUpdated={handleUpdated}
            onStaleVersion={setStaleMessage}
          />
          <BusinessHoursCard
            organization={organization}
            onUpdated={handleUpdated}
            onStaleVersion={setStaleMessage}
          />
        </div>

        <AiInstructionsCard
          organization={organization}
          onUpdated={handleUpdated}
          onStaleVersion={setStaleMessage}
        />
      </div>
    </div>
  );
}
