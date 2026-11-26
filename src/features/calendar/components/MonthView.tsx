"use client";

import { useState } from "react";
import { getDayHoursForDate } from "../business-hours";
import {
  getPersonAccent,
  resolveCustomerName,
} from "../calendar-ui-helpers";
import {
  formatAppointmentTime,
  getAppointmentLocalDateKey,
  getMonthGridDays,
} from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";
import { MonthViewMobile } from "./MonthViewMobile";

interface MonthViewProps {
  dateKey: string;
  todayKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onOpenDay: (dateKey: string) => void;
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({
  dateKey,
  todayKey,
  timezone,
  businessHours,
  people,
  appointments,
  customers,
  services,
  onSelectAppointment,
  onOpenDay,
}: MonthViewProps) {
  const [selectedMobileDay, setSelectedMobileDay] = useState(dateKey);
  const currentMonthPrefix = dateKey.slice(0, 7);
  const gridDays = getMonthGridDays(dateKey);

  const byDay = new Map<string, AppointmentDto[]>();
  for (const appt of appointments) {
    const key = getAppointmentLocalDateKey(appt.starts_at, timezone);
    const list = byDay.get(key) ?? [];
    list.push(appt);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  return (
    <div className="space-y-4">
      {/* Desktop: 7-column Mon–Sun month grid */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAY_HEADERS.map((label) => (
            <div
              key={label}
              className="px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((day) => {
            const inMonth = day.startsWith(currentMonthPrefix);
            const isToday = day === todayKey;
            const dayNum = Number.parseInt(day.slice(8, 10), 10);
            const dayItems = byDay.get(day) ?? [];
            const visible = dayItems.slice(0, 2);
            const overflow = dayItems.length - visible.length;
            const dayHours = getDayHoursForDate(day, businessHours);
            const isClosed = dayHours !== null && !dayHours.is_open;

            return (
              <div
                key={day}
                className={`min-h-[112px] border-b border-r p-2 transition-colors last:border-r-0 ${
                  !inMonth
                    ? "bg-muted/20 text-muted-foreground"
                    : isClosed
                      ? "bg-muted/30 text-muted-foreground"
                      : "bg-card"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenDay(day)}
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors hover:bg-muted ${
                      isToday
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : isClosed
                          ? "text-muted-foreground"
                          : ""
                    }`}
                  >
                    {dayNum}
                  </button>
                  {isClosed && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Closed
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {visible.map((appt) => {
                    const accent = getPersonAccent(appt.person_id, people);
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => onSelectAppointment(appt)}
                        className={`flex w-full min-w-0 items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-left text-[11px] font-medium transition-colors ${accent.pill}`}
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${accent.dot}`}
                        />
                        <span className="min-w-0 truncate tabular-nums">
                          {formatAppointmentTime(appt.starts_at, timezone)} ·{" "}
                          {resolveCustomerName(appt, customers)}
                        </span>
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenDay(day)}
                      className="px-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MonthViewMobile
        dateKey={dateKey}
        todayKey={todayKey}
        timezone={timezone}
        businessHours={businessHours}
        weekdayHeaders={WEEKDAY_HEADERS}
        gridDays={gridDays}
        currentMonthPrefix={currentMonthPrefix}
        selectedMobileDay={selectedMobileDay}
        onSelectMobileDay={setSelectedMobileDay}
        byDay={byDay}
        totalCount={appointments.length}
        people={people}
        customers={customers}
        services={services}
        onSelectAppointment={onSelectAppointment}
        onOpenDay={onOpenDay}
      />
    </div>
  );
}
