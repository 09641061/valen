"use client";

import { Button } from "@/components/ui/button";
import { getDayHoursForDate } from "../business-hours";
import { formatDateHeader, formatMonthHeader } from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { MobileAppointmentList } from "./TimeGridParts";

interface MonthViewMobileProps {
  dateKey: string;
  todayKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  weekdayHeaders: string[];
  gridDays: string[];
  currentMonthPrefix: string;
  selectedMobileDay: string;
  onSelectMobileDay: (day: string) => void;
  byDay: Map<string, AppointmentDto[]>;
  totalCount: number;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onOpenDay: (dateKey: string) => void;
}

export function MonthViewMobile({
  dateKey,
  todayKey,
  timezone,
  businessHours,
  weekdayHeaders,
  gridDays,
  currentMonthPrefix,
  selectedMobileDay,
  onSelectMobileDay,
  byDay,
  totalCount,
  people,
  customers,
  services,
  onSelectAppointment,
  onOpenDay,
}: MonthViewMobileProps) {
  const mobileDayAppointments = byDay.get(selectedMobileDay) ?? [];

  return (
    <div className="space-y-3 md:hidden">
      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {formatMonthHeader(dateKey, timezone)}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? "appointment" : "appointments"}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
          {weekdayHeaders.map((d) => (
            <div key={d} className="py-1">
              {d.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day) => {
            const inMonth = day.startsWith(currentMonthPrefix);
            const isSelected = day === selectedMobileDay;
            const isToday = day === todayKey;
            const hasItems = (byDay.get(day)?.length ?? 0) > 0;
            const dayNum = Number.parseInt(day.slice(8, 10), 10);
            const dayHours = getDayHoursForDate(day, businessHours);
            const isClosed = dayHours !== null && !dayHours.is_open;

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectMobileDay(day)}
                className={`flex flex-col items-center justify-center rounded-lg py-1.5 text-xs ${
                  isSelected
                    ? "bg-emerald-600 font-semibold text-white"
                    : isToday
                      ? "bg-emerald-50 font-semibold text-emerald-700"
                      : inMonth && !isClosed
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground/50"
                }`}
              >
                <span>{dayNum}</span>
                <span
                  className={`mt-0.5 size-1 rounded-full ${
                    hasItems
                      ? isSelected
                        ? "bg-white"
                        : "bg-emerald-600"
                      : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {formatDateHeader(selectedMobileDay, timezone)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenDay(selectedMobileDay)}
          >
            Open day
          </Button>
        </div>

        {mobileDayAppointments.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">
            No appointments on this day.
          </p>
        ) : (
          <MobileAppointmentList
            appointments={mobileDayAppointments}
            timezone={timezone}
            people={people}
            customers={customers}
            services={services}
            onSelectAppointment={onSelectAppointment}
          />
        )}
      </div>
    </div>
  );
}
