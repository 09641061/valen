"use client";

import { ClockIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatChannelLabel,
  getInitials,
  getPersonAccent,
  resolveCustomerName,
  resolveServiceName,
} from "../calendar-ui-helpers";
import { formatAppointmentTime, formatDateHeader } from "../date-utils";
import type {
  AppointmentDto,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";

interface DayViewMobileProps {
  dateKey: string;
  timezone: string;
  isClosed: boolean;
  people: CalendarPersonDto[];
  dayAppointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onSelectAppointment: (appointment: AppointmentDto) => void;
  onCreateAtSlot: (params: { date: string; time?: string; personId?: string }) => void;
}

export function DayViewMobile({
  dateKey,
  timezone,
  isClosed,
  people,
  dayAppointments,
  customers,
  services,
  onSelectAppointment,
  onCreateAtSlot,
}: DayViewMobileProps) {
  return (
    <div className="space-y-3 md:hidden">
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatDateHeader(dateKey, timezone)}</span>
          {isClosed && (
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              Closed
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {dayAppointments.length} {dayAppointments.length === 1 ? "appointment" : "appointments"}
        </span>
      </div>

      {people.map((person) => {
        const personItems = dayAppointments.filter((a) => a.person_id === person.id);
        return (
          <div key={person.id} className="rounded-xl border bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${getPersonAccent(person.id, people).avatar}`}
              >
                {getInitials(person.name)}
              </span>
              <span className="text-sm font-medium">{person.name}</span>
            </div>

            {personItems.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">No appointments</p>
            ) : (
              <div className="space-y-2">
                {personItems.map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => onSelectAppointment(appt)}
                    className="flex w-full items-start justify-between gap-2 rounded-lg border p-2.5 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3.5" />
                        <span>{formatAppointmentTime(appt.starts_at, timezone)}</span>
                      </div>
                      <p className="truncate text-sm font-medium">
                        {resolveCustomerName(appt, customers)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {resolveServiceName(appt, services)} · {formatChannelLabel(appt.channel)}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_BADGE_CLASSES[appt.status]}>
                      {STATUS_LABELS[appt.status]}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {!isClosed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start text-muted-foreground"
                onClick={() => onCreateAtSlot({ date: dateKey, personId: person.id })}
              >
                <PlusIcon className="size-4" />
                New appointment
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
