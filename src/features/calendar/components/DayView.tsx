"use client";

import { Badge } from "@/components/ui/badge";
import {
  buildHourList,
  getDayHoursForDate,
  getGridHourBounds,
} from "../business-hours";
import { TimeAxisColumn, TimeGridColumn } from "./TimeGridParts";
import {
  HOUR_HEIGHT_PX,
  getInitials,
  getPersonAccent,
} from "../calendar-ui-helpers";
import { getAppointmentLocalDateKey } from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { DayViewMobile } from "./DayViewMobile";

interface DayViewProps {
  dateKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onCreateAtSlot: (params: { date: string; time?: string; personId?: string }) => void;
}

export function DayView({
  dateKey,
  timezone,
  businessHours,
  people,
  appointments,
  customers,
  services,
  onSelectAppointment,
  onCreateAtSlot,
}: DayViewProps) {
  const dayAppointments = appointments
    .filter((a) => getAppointmentLocalDateKey(a.starts_at, timezone) === dateKey)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const dayHours = getDayHoursForDate(dateKey, businessHours);
  const isClosed = dayHours !== null && !dayHours.is_open;
  const { startHour, endHour } = getGridHourBounds(businessHours, dayAppointments, timezone);
  const hours = buildHourList(startHour, endHour);
  const totalHeight = hours.length * HOUR_HEIGHT_PX;

  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        No bookable people available for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isClosed && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-dashed bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background text-xs font-semibold">
              Closed
            </Badge>
            <span>Business is closed on this day according to general business hours.</span>
          </div>
        </div>
      )}

      {/* Desktop: time axis + person columns */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <div
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `72px repeat(${people.length}, minmax(180px, 1fr))` }}
        >
          <div className="border-b border-r bg-muted/30 px-3 py-3 text-xs font-medium text-muted-foreground">
            Time
          </div>
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-2.5 border-b border-r px-3 py-2.5 last:border-r-0"
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getPersonAccent(person.id, people).avatar}`}
              >
                {getInitials(person.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {person.role_label || "Staff"}
                </p>
              </div>
            </div>
          ))}

          {/* Time labels column */}
          <TimeAxisColumn hours={hours} totalHeight={totalHeight} />

          {/* Person columns */}
          {people.map((person) => {
            const personItems = dayAppointments.filter((a) => a.person_id === person.id);
            return (
              <TimeGridColumn
                key={person.id}
                variant="day"
                hours={hours}
                startHour={startHour}
                totalHeight={totalHeight}
                dayHours={dayHours}
                timezone={timezone}
                people={people}
                appointments={personItems}
                customers={customers}
                services={services}
                getSlotLabel={(time) => `New appointment for ${person.name} at ${time}`}
                onSlotClick={(time) => onCreateAtSlot({ date: dateKey, time, personId: person.id })}
                onSelectAppointment={onSelectAppointment}
              />
            );
          })}
        </div>
      </div>

      <DayViewMobile
        dateKey={dateKey}
        timezone={timezone}
        isClosed={isClosed}
        people={people}
        dayAppointments={dayAppointments}
        customers={customers}
        services={services}
        onSelectAppointment={onSelectAppointment}
        onCreateAtSlot={onCreateAtSlot}
      />
    </div>
  );
}
