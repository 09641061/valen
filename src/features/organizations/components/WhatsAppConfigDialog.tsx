"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateWhatsAppConfigAction } from "../actions";
import {
  UpdateWhatsAppConfigSchema,
  type OrganizationDto,
} from "../schemas";

interface WhatsAppConfigDialogProps {
  open: boolean;
  organization: OrganizationDto;
  onOpenChange: (open: boolean) => void;
  onUpdated: (org: OrganizationDto) => void;
}

type WhatsAppFieldErrors = Partial<
  Record<"whatsapp_phone_number" | "whatsapp_phone_number_id", string>
>;

export function WhatsAppConfigDialog({
  open,
  organization,
  onOpenChange,
  onUpdated,
}: WhatsAppConfigDialogProps) {
  const [enabled, setEnabled] = useState(organization.whatsapp_enabled);
  const [phoneNumber, setPhoneNumber] = useState(
    organization.whatsapp_phone_number,
  );
  const [phoneNumberId, setPhoneNumberId] = useState(
    organization.whatsapp_phone_number_id,
  );
  const [fieldErrors, setFieldErrors] = useState<WhatsAppFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = UpdateWhatsAppConfigSchema.safeParse({
      whatsapp_enabled: enabled,
      whatsapp_phone_number: phoneNumber,
      whatsapp_phone_number_id: phoneNumberId,
    });

    if (!parsed.success) {
      const nextErrors: WhatsAppFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          (key === "whatsapp_phone_number" ||
            key === "whatsapp_phone_number_id") &&
          !nextErrors[key]
        ) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const result = await updateWhatsAppConfigAction({
        whatsapp_enabled: enabled,
        whatsapp_phone_number: phoneNumber,
        whatsapp_phone_number_id: phoneNumberId,
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors({
            whatsapp_phone_number:
              result.fieldErrors.whatsapp_phone_number?.[0],
            whatsapp_phone_number_id:
              result.fieldErrors.whatsapp_phone_number_id?.[0],
          });
        }
        setErrorMessage(result.message);
        return;
      }

      onUpdated(result.data);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp Business configuration</DialogTitle>
          <DialogDescription>
            Connect your WhatsApp Business number to send and receive customer
            messages.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border px-3.5 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-enabled">Enable WhatsApp</Label>
              <p className="text-xs text-muted-foreground">
                Allow inbound and outbound WhatsApp messages.
              </p>
            </div>
            <Switch
              id="whatsapp-enabled"
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                setFieldErrors({});
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-phone-number">WhatsApp number</Label>
            <Input
              id="whatsapp-phone-number"
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  whatsapp_phone_number: undefined,
                }));
              }}
              placeholder="+51994356103"
              aria-invalid={Boolean(fieldErrors.whatsapp_phone_number)}
            />
            {fieldErrors.whatsapp_phone_number ? (
              <p className="text-xs text-destructive">
                {fieldErrors.whatsapp_phone_number}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-phone-number-id">Phone Number ID</Label>
            <Input
              id="whatsapp-phone-number-id"
              value={phoneNumberId}
              onChange={(event) => {
                setPhoneNumberId(event.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  whatsapp_phone_number_id: undefined,
                }));
              }}
              placeholder="106540352242922"
              aria-invalid={Boolean(fieldErrors.whatsapp_phone_number_id)}
            />
            {fieldErrors.whatsapp_phone_number_id ? (
              <p className="text-xs text-destructive">
                {fieldErrors.whatsapp_phone_number_id}
              </p>
            ) : null}
          </div>

          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Access Token and Webhook Secret are configured on the server via{" "}
            <code className="font-mono">.env</code> and are never exposed to the
            browser.
          </p>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
