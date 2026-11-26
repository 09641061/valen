"use client";

import { isHourSlotOpen } from "../business-hours";
import { HOUR_HEIGHT_PX } from "../calendar-ui-helpers";
import type {
  AppointmentDto,
  CalendarCustomerOption,
  CalendarDayHours,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { AppointmentCard } from "./AppointmentCard";
import { MobileAppointmentRow } from "./MobileAppointmentRow";

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function TimeAxisColumn({
  hours,
  totalHeight,
}: {
  hours: number[];
  totalHeight: number;
}) {
  return (
    <div className="relative border-r bg-muted/10" style={{ height: totalHeight }}>
      {hours.map((hour, index) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-b border-border/60 px-2 pt-1.5 text-xs tabular-nums text-muted-foreground"
          style={{ top: index * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
        >
          {formatHourLabel(hour)}
        </div>
      ))}
    </div>
  );
}

export function TimeGridSlots({
  hours,
  dayHours,
  getSlotLabel,
  onSlotClick,
}: {
  hours: number[];
  dayHours: CalendarDayHours | null;
  getSlotLabel: (time: string) => string;
  onSlotClick: (time: string) => void;
}) {
  return (
    <>
      {hours.map((hour, index) => {
        const time = formatHourLabel(hour);
        if (!isHourSlotOpen(hour, dayHours)) {
          return (
            <div
              key={hour}
              aria-disabled="true"
              className="absolute inset-x-0 border-b border-border/60 bg-muted/50"
              style={{ top: index * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
            />
          );
        }
        return (
          <button
            key={hour}
            type="button"
            aria-label={getSlotLabel(time)}
            onClick={() => onSlotClick(time)}
            className="absolute inset-x-0 border-b border-border/60 text-left transition-colors hover:bg-emerald-50/40 focus-visible:bg-emerald-50/50 focus-visible:outline-none"
            style={{ top: index * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
          />
        );
      })}
    </>
  );
}

export function TimeGridColumn({
  variant,
  hours,
  startHour,
  totalHeight,
  dayHours,
  timezone,
  people,
  appointments,
  customers,
  services,
  className = "",
  getSlotLabel,
  onSlotClick,
  onSelectAppointment,
}: {
  variant: "day" | "week";
  hours: number[];
  startHour: number;
  totalHeight: number;
  dayHours: CalendarDayHours | null;
  timezone: string;
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  className?: string;
  getSlotLabel: (time: string) => string;
  onSlotClick: (time: string) => void;
  onSelectAppointment: (appointment: AppointmentDto) => void;
}) {
  return (
    <div
      className={`relative border-r last:border-r-0 ${className}`}
      style={{ height: totalHeight }}
    >
      <TimeGridSlots
        hours={hours}
        dayHours={dayHours}
        getSlotLabel={getSlotLabel}
        onSlotClick={onSlotClick}
      />
      {appointments.map((appt) => (
        <AppointmentCard
          key={appt.id}
          variant={variant}
          appointment={appt}
          timezone={timezone}
          gridStartHour={startHour}
          people={people}
          customers={customers}
          services={services}
          onSelect={onSelectAppointment}
        />
      ))}
    </div>
  );
}

export function MobileAppointmentList({
  appointments,
  timezone,
  people,
  customers,
  services,
  onSelectAppointment,
  className = "space-y-2",
}: {
  appointments: AppointmentDto[];
  timezone: string;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {appointments.map((appt) => (
        <MobileAppointmentRow
          key={appt.id}
          appointment={appt}
          timezone={timezone}
          people={people}
          customers={customers}
          services={services}
          onSelect={onSelectAppointment}
        />
      ))}
    </div>
  );
}
