"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createServiceAction, updateServiceAction } from "../actions";
import {
  formatMinorUnitsToInput,
  parsePriceToMinorUnits,
} from "../format";
import { CreateServiceSchema, type ServiceDto } from "../schemas";
import { CatalogFormFooter } from "./CatalogFormFooter";
import {
  extractZodFieldErrors,
  handleDialogActionFailure,
  mapActionFieldErrors,
} from "./dialog-helpers";
import { ServiceFormFields } from "./ServiceFormFields";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  service?: ServiceDto | null;
  currencyCode?: string;
  onStaleVersion: (message: string) => void;
  onSuccess: () => void;
}

function getInitialServiceForm(service?: ServiceDto | null) {
  if (!service) {
    return {
      name: "",
      duration: "30",
      price: "0.00",
    };
  }
  return {
    name: service.name,
    duration: String(service.duration_minutes),
    price: formatMinorUnitsToInput(service.price_minor_units),
  };
}

export function ServiceDialog({
  open,
  onOpenChange,
  categoryId,
  service,
  currencyCode = "USD",
  onStaleVersion,
  onSuccess,
}: ServiceDialogProps) {
  const isEditing = Boolean(service);
  const initial = getInitialServiceForm(service);
  const [name, setName] = useState(initial.name);
  const [duration, setDuration] = useState(initial.duration);
  const [price, setPrice] = useState(initial.price);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsedDuration = Number.parseInt(duration, 10);
    const minorUnits = parsePriceToMinorUnits(price);

    if (minorUnits === null) {
      setFieldErrors({
        price_minor_units: "Enter a valid price (e.g. 25.00)",
      });
      return;
    }

    const candidate = {
      category_id: service?.category_id ?? categoryId,
      name,
      duration_minutes: Number.isNaN(parsedDuration) ? -1 : parsedDuration,
      price_minor_units: minorUnits,
    };

    const parsed = CreateServiceSchema.safeParse(candidate);
    if (!parsed.success) {
      setFieldErrors(extractZodFieldErrors(parsed.error));
      return;
    }

    startTransition(async () => {
      const result = service
        ? await updateServiceAction({
            id: service.id,
            version: service.version,
            name: parsed.data.name,
            duration_minutes: parsed.data.duration_minutes,
            price_minor_units: parsed.data.price_minor_units,
          })
        : await createServiceAction(parsed.data);

      if (!result.ok) {
        if (handleDialogActionFailure(result, onOpenChange, onStaleVersion)) {
          return;
        }
        if (result.fieldErrors) {
          setFieldErrors(mapActionFieldErrors(result.fieldErrors));
        }
        setFormError(result.message);
        return;
      }

      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit service" : "New service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for the selected service."
              : "Add a service to this category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ServiceFormFields
            name={name}
            duration={duration}
            price={price}
            currencyCode={currencyCode}
            isPending={isPending}
            fieldErrors={fieldErrors}
            onNameChange={setName}
            onDurationChange={setDuration}
            onPriceChange={setPrice}
          />

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <CatalogFormFooter
            isPending={isPending}
            isEditing={isEditing}
            createLabel="Create service"
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
