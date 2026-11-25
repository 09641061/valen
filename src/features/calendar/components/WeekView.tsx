"use client";

import { Badge } from "@/components/ui/badge";
import {
  buildHourList,
  getDayHoursForDate,
  getGridHourBounds,
} from "../business-hours";
import { TimeAxisColumn, TimeGridColumn } from "./TimeGridParts";
import { HOUR_HEIGHT_PX } from "../calendar-ui-helpers";
import {
  formatShortWeekday,
  getAppointmentLocalDateKey,
  getWeekDays,
} from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { WeekViewMobile } from "./WeekViewMobile";

interface WeekViewProps {
  dateKey: string;
  todayKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onCreateAtSlot: (params: { date: string; time?: string }) => void;
  onSelectDay: (dateKey: string) => void;
}

export function WeekView({
  dateKey,
  todayKey,
  timezone,
  businessHours,
  people,
  appointments,
  customers,
  services,
  onSelectAppointment,
  onCreateAtSlot,
  onSelectDay,
}: WeekViewProps) {
  const weekDays = getWeekDays(dateKey);
  const { startHour, endHour } = getGridHourBounds(businessHours, appointments, timezone);
  const hours = buildHourList(startHour, endHour);
  const totalHeight = hours.length * HOUR_HEIGHT_PX;

  return (
    <div className="space-y-4">
      {/* Desktop: 7-day grid with vertical time axis */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <div
          className="grid min-w-[900px]"
          style={{ gridTemplateColumns: "68px repeat(7, minmax(120px, 1fr))" }}
        >
          <div className="border-b border-r bg-muted/30 px-2 py-3 text-xs font-medium text-muted-foreground">
            Time
          </div>
          {weekDays.map((day) => {
            const isToday = day === todayKey;
            const dayNum = Number.parseInt(day.slice(8, 10), 10);
            const dayHours = getDayHoursForDate(day, businessHours);
            const isClosed = dayHours !== null && !dayHours.is_open;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`flex flex-col items-center gap-1 border-b border-r py-2 text-center transition-colors hover:bg-muted/40 last:border-r-0 ${
                  isClosed ? "bg-muted/30" : ""
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {formatShortWeekday(day, timezone)}
                </span>
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                    isToday
                      ? "bg-emerald-600 text-white"
                      : isClosed
                        ? "text-muted-foreground"
                        : "text-foreground"
                  }`}
                >
                  {dayNum}
                </span>
                {isClosed && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
                    Closed
                  </Badge>
                )}
              </button>
            );
          })}

          <TimeAxisColumn hours={hours} totalHeight={totalHeight} />

          {weekDays.map((day) => {
            const dayHours = getDayHoursForDate(day, businessHours);
            const isClosed = dayHours !== null && !dayHours.is_open;
            const dayItems = appointments
              .filter((a) => getAppointmentLocalDateKey(a.starts_at, timezone) === day)
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

            return (
              <TimeGridColumn
                key={day}
                variant="week"
                hours={hours}
                startHour={startHour}
                totalHeight={totalHeight}
                dayHours={dayHours}
                timezone={timezone}
                people={people}
                appointments={dayItems}
                customers={customers}
                services={services}
                className={isClosed ? "bg-muted/20" : ""}
                getSlotLabel={(time) => `New appointment on ${day} at ${time}`}
                onSlotClick={(time) => onCreateAtSlot({ date: day, time })}
                onSelectAppointment={onSelectAppointment}
              />
            );
          })}
        </div>
      </div>

      <WeekViewMobile
        dateKey={dateKey}
        todayKey={todayKey}
        timezone={timezone}
        businessHours={businessHours}
        weekDays={weekDays}
        people={people}
        appointments={appointments}
        customers={customers}
        services={services}
        onSelectAppointment={onSelectAppointment}
        onSelectDay={onSelectDay}
      />
    </div>
  );
}
