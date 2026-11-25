"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAppointmentAction, updateAppointmentAction } from "../actions";
import { getDayHoursForDate } from "../business-hours";
import { getAppointmentDialogCopy, getInitialAppointmentFields, mapAppointmentSaveError, validateAppointmentForm } from "../calendar-ui-helpers";
import { addMinutesToIso, zonedDateTimeToUtcIso } from "../date-utils";
import { DatePickerField } from "./DatePickerField";
import { SearchableCombobox } from "./SearchableCombobox";
import { TimePickerField } from "./TimePickerField";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";

export interface AppointmentFormPrefill {
  date: string;
  time?: string;
  personId?: string;
  customerId?: string;
}

interface AppointmentFormDialogProps {
  open: boolean;
  appointment: AppointmentDto | null;
  prefill: AppointmentFormPrefill;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: (appointment: AppointmentDto) => void;
}

export function AppointmentFormDialog({
  open,
  appointment,
  prefill,
  timezone,
  businessHours,
  people,
  customers,
  services,
  onOpenChange,
  onSaved,
}: AppointmentFormDialogProps) {
  const isEdit = Boolean(appointment);
  const initial = getInitialAppointmentFields(appointment, prefill, timezone, people, customers, services);
  const [customerId, setCustomerId] = useState(initial.customerId);
  const [serviceId, setServiceId] = useState(initial.serviceId);
  const [personId, setPersonId] = useState(initial.personId);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [notes, setNotes] = useState(initial.notes);
  const [errorBanner, setErrorBanner] = useState<{ title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = getAppointmentDialogCopy(isEdit, isPending);

  const durationMinutes = services.find((s) => s.id === serviceId)?.duration_minutes ?? 30;
  const dayHours = getDayHoursForDate(date, businessHours);
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.phone})`,
    keywords: `${c.name} ${c.phone}`,
  }));
  const serviceItems = services.map((s) => ({
    value: s.id,
    label: `${s.name} · ${s.duration_minutes} min`,
  }));
  const personOptions = people.map((p) => ({ value: p.id, label: p.name }));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorBanner(null);

    const validationError = validateAppointmentForm({
      customerId,
      serviceId,
      personId,
      date,
      time,
      durationMinutes,
      businessHours,
    });
    if (validationError) {
      setErrorBanner(validationError);
      return;
    }

    const startsAt = zonedDateTimeToUtcIso(date, time, timezone);
    const endsAt = addMinutesToIso(startsAt, durationMinutes);

    startTransition(async () => {
      const result = appointment
        ? await updateAppointmentAction({
            id: appointment.id,
            version: appointment.version,
            customer_id: customerId,
            service_id: serviceId,
            person_id: personId,
            starts_at: startsAt,
            ends_at: endsAt,
            notes,
          })
        : await createAppointmentAction({
            customer_id: customerId,
            service_id: serviceId,
            person_id: personId,
            starts_at: startsAt,
            ends_at: endsAt,
            notes,
            channel: "manual",
          });

      if (!result.ok) {
        setErrorBanner(mapAppointmentSaveError(result.code, result.message));
        return;
      }
      onSaved(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorBanner && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">{errorBanner.title}</p>
                <p>{errorBanner.message}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="appt-customer">Customer</Label>
            <SearchableCombobox id="appt-customer" value={customerId} options={customerOptions} onValueChange={setCustomerId} placeholder="Select a customer" searchPlaceholder="Search customer by name or phone..." emptyMessage="No customers found." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-service">Service</Label>
            <Select items={serviceItems} value={serviceId || null} onValueChange={(v) => setServiceId(v ?? "")}>
              <SelectTrigger id="appt-service" className="w-full"><SelectValue placeholder="Select a service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appt-date">Date</Label>
              <DatePickerField id="appt-date" value={date} onChange={setDate} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-time">Time</Label>
              <TimePickerField id="appt-time" value={time} onChange={setTime} dayHours={dayHours} required />
            </div>
          </div>
          {dayHours && !dayHours.is_open && (
            <p className="text-xs font-medium text-amber-700">Business is closed on this day.</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="appt-person">Person</Label>
            {people.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                No active team members available. Add or activate a team member before scheduling.
              </p>
            ) : (
              <SearchableCombobox id="appt-person" value={personId} options={personOptions} onValueChange={setPersonId} placeholder="Select a person" searchPlaceholder="Search person..." emptyMessage="No people found." />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="appt-notes">Notes (optional)</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {notes.length}/1000
              </span>
            </div>
            <Textarea
              id="appt-notes"
              placeholder="Add an optional note for the team"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              className="resize-none max-h-28 overflow-y-auto"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {copy.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
