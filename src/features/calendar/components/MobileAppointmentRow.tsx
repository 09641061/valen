"use client";

import { Badge } from "@/components/ui/badge";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  resolveCustomerName,
  resolvePersonName,
  resolveServiceName,
} from "../calendar-ui-helpers";
import { formatAppointmentTime } from "../date-utils";
import type {
  AppointmentDto,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";

interface MobileAppointmentRowProps {
  appointment: AppointmentDto;
  timezone: string;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelect: (appointment: AppointmentDto) => void;
}

export function MobileAppointmentRow({
  appointment,
  timezone,
  people,
  customers,
  services,
  onSelect,
}: MobileAppointmentRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card p-2.5 text-left hover:bg-muted/40"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          {formatAppointmentTime(appointment.starts_at, timezone)}
        </p>
        <p className="truncate text-sm font-medium">
          {resolveCustomerName(appointment, customers)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {resolveServiceName(appointment, services)} ·{" "}
          {resolvePersonName(appointment, people)}
        </p>
      </div>
      <Badge variant="outline" className={STATUS_BADGE_CLASSES[appointment.status]}>
        {STATUS_LABELS[appointment.status]}
      </Badge>
    </button>
  );
}
