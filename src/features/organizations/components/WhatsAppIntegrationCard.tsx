"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationDto } from "../schemas";
import { WhatsAppConfigDialog } from "./WhatsAppConfigDialog";

interface WhatsAppIntegrationCardProps {
  organization: OrganizationDto;
  onUpdated: (org: OrganizationDto) => void;
  onStaleVersion: (message: string) => void;
}

export function WhatsAppIntegrationCard({
  organization,
  onUpdated,
  onStaleVersion,
}: WhatsAppIntegrationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const isConnected =
    organization.whatsapp_enabled &&
    organization.whatsapp_phone_number.length > 0;

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Channels and integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <MessageCircle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  WhatsApp Business
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect the customer conversation and booking channel.
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isConnected
                    ? `• Connected · ${organization.whatsapp_phone_number}`
                    : "• Disconnected"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      <WhatsAppConfigDialog
        key={`${organization.version}-${dialogOpen ? "open" : "closed"}`}
        open={dialogOpen}
        organization={organization}
        onOpenChange={setDialogOpen}
        onUpdated={onUpdated}
        onStaleVersion={onStaleVersion}
      />
    </>
  );
}
