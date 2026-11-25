"use client";

import { Badge } from "@/components/ui/badge";
import {
  HOUR_HEIGHT_PX,
  MIN_APPOINTMENT_CARD_HEIGHT_PX,
  STATUS_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  getPersonAccent,
  resolveCustomerName,
  resolvePersonName,
  resolveServiceName,
} from "../calendar-ui-helpers";
import {
  formatAppointmentTime,
  getAppointmentMinutesFromMidnight,
} from "../date-utils";
import type {
  AppointmentDto,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";

function computeAppointmentBlockLayout(
  startsAt: string,
  endsAt: string,
  timezone: string,
  gridStartHour: number,
): { top: number; height: number } {
  const startMins = getAppointmentMinutesFromMidnight(startsAt, timezone);
  const endMins = getAppointmentMinutesFromMidnight(endsAt, timezone);
  const duration = Math.max(15, endMins - startMins);
  const rawTop = Math.max(0, ((startMins - gridStartHour * 60) / 60) * HOUR_HEIGHT_PX);
  const proportionalHeight = (duration / 60) * HOUR_HEIGHT_PX - 4;
  return {
    top: rawTop + 2,
    height: Math.max(MIN_APPOINTMENT_CARD_HEIGHT_PX, proportionalHeight),
  };
}

interface AppointmentCardProps {
  variant: "day" | "week";
  appointment: AppointmentDto;
  timezone: string;
  gridStartHour: number;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelect: (appointment: AppointmentDto) => void;
}

export function AppointmentCard({
  variant,
  appointment,
  timezone,
  gridStartHour,
  people,
  customers,
  services,
  onSelect,
}: AppointmentCardProps) {
  const { top, height } = computeAppointmentBlockLayout(
    appointment.starts_at,
    appointment.ends_at,
    timezone,
    gridStartHour,
  );
  const isDay = variant === "day";
  const customerName = resolveCustomerName(appointment, customers);
  const personName = resolvePersonName(appointment, people);
  const personAccent = getPersonAccent(appointment.person_id, people);

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      style={{ top, height }}
      className={`absolute z-10 flex min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-border bg-card text-left shadow-xs transition-colors hover:border-foreground/25 ${
        isDay ? "inset-x-1.5 px-3 py-2" : "inset-x-1 px-2.5 py-2"
      } ${appointment.status === "cancelled" ? "opacity-70" : ""}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tabular-nums text-foreground">
          <span
            className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASSES[appointment.status]}`}
            aria-hidden="true"
          />
          <span className="truncate">{formatAppointmentTime(appointment.starts_at, timezone)}</span>
        </span>
        <Badge
          variant="outline"
          className={`shrink-0 font-medium ${
            isDay ? "h-5 px-2 text-[11px]" : "h-4 px-1.5 text-[10px]"
          } ${STATUS_BADGE_CLASSES[appointment.status]}`}
        >
          {STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      <p
        className={`truncate font-semibold leading-tight text-foreground ${
          isDay ? "text-sm" : "text-xs"
        }`}
      >
        {customerName}
      </p>

      {isDay ? (
        <div className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{resolveServiceName(appointment, services)}</span>
          <span className="max-w-[45%] shrink-0 truncate">{personName}</span>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`size-1.5 shrink-0 rounded-full ${personAccent.dot}`} />
          <span className="truncate">{personName}</span>
        </div>
      )}
    </button>
  );
}
