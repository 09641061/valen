"use client";

import { Badge } from "@/components/ui/badge";
import { getDayHoursForDate } from "../business-hours";
import {
  formatShortWeekday,
  formatWeekRangeHeader,
  getAppointmentLocalDateKey,
} from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { MobileAppointmentList } from "./TimeGridParts";

interface WeekViewMobileProps {
  dateKey: string;
  todayKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  weekDays: string[];
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onSelectDay: (dateKey: string) => void;
}

export function WeekViewMobile({
  dateKey,
  todayKey,
  timezone,
  businessHours,
  weekDays,
  people,
  appointments,
  customers,
  services,
  onSelectAppointment,
  onSelectDay,
}: WeekViewMobileProps) {
  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <span className="text-sm font-semibold">
          {formatWeekRangeHeader(dateKey, timezone)}
        </span>
        <span className="text-xs text-muted-foreground">
          {appointments.length} {appointments.length === 1 ? "appointment" : "appointments"}
        </span>
      </div>

      {weekDays.map((day) => {
        const dayItems = appointments
          .filter((a) => getAppointmentLocalDateKey(a.starts_at, timezone) === day)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        const isToday = day === todayKey;
        const dayNum = Number.parseInt(day.slice(8, 10), 10);
        const dayHours = getDayHoursForDate(day, businessHours);
        const isClosed = dayHours !== null && !dayHours.is_open;

        return (
          <div
            key={day}
            className={`rounded-xl border p-3 ${
              isToday
                ? "border-emerald-300 bg-emerald-50/20"
                : isClosed
                  ? "bg-muted/30"
                  : "bg-card"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span>
                  {formatShortWeekday(day, timezone)} {dayNum}
                </span>
                {isClosed && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
                    Closed
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {dayItems.length === 0
                  ? "No appointments"
                  : `${dayItems.length} ${dayItems.length === 1 ? "appointment" : "appointments"}`}
              </span>
            </button>

            {dayItems.length > 0 && (
              <MobileAppointmentList
                appointments={dayItems}
                timezone={timezone}
                people={people}
                customers={customers}
                services={services}
                onSelectAppointment={onSelectAppointment}
                className="mt-2 space-y-1.5"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
