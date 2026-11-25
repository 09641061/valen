"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  addDays,
  addMonths,
  formatDateHeader,
  formatMonthHeader,
  formatWeekRangeHeader,
} from "../date-utils";
import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
  CalendarViewMode,
} from "../schemas";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import {
  AppointmentFormDialog,
  type AppointmentFormPrefill,
} from "./AppointmentFormDialog";
import { CalendarToolbar } from "./CalendarToolbar";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";

interface CalendarWorkspaceProps {
  initialView: CalendarViewMode;
  initialDate: string;
  todayKey: string;
  timezone: string;
  businessHours?: CalendarBusinessHours | null;
  initialSelectedPersonId?: string;
  initialCustomerId?: string;
  people: CalendarPersonDto[];
  initialAppointments: AppointmentDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
}

export function CalendarWorkspace({
  initialView,
  initialDate,
  todayKey,
  timezone,
  businessHours,
  initialSelectedPersonId,
  initialCustomerId,
  people,
  initialAppointments,
  customers,
  services,
}: CalendarWorkspaceProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(
    initialSelectedPersonId ? [initialSelectedPersonId] : [],
  );
  const [detailAppointment, setDetailAppointment] =
    useState<AppointmentDto | null>(null);
  const [formState, setFormState] = useState<{
    open: boolean;
    key: number;
    appointment: AppointmentDto | null;
    prefill: AppointmentFormPrefill;
  }>(() => ({
    open: Boolean(initialCustomerId),
    key: 0,
    appointment: null,
    prefill: { date: initialDate, customerId: initialCustomerId },
  }));

  const visiblePeople =
    selectedPersonIds.length === 0
      ? people
      : people.filter((p) => selectedPersonIds.includes(p.id));

  const visibleAppointments =
    selectedPersonIds.length === 0
      ? appointments
      : appointments.filter((a) => selectedPersonIds.includes(a.person_id));

  function navigate(nextView: CalendarViewMode, nextDate: string) {
    const params = new URLSearchParams();
    params.set("view", nextView);
    params.set("date", nextDate);
    if (selectedPersonIds.length === 1) {
      params.set("personId", selectedPersonIds[0]);
    }
    router.push(`/calendar?${params.toString()}`);
  }

  function stepPeriod(direction: -1 | 1) {
    const nextDate =
      initialView === "day"
        ? addDays(initialDate, direction)
        : initialView === "week"
          ? addDays(initialDate, direction * 7)
          : addMonths(initialDate, direction);
    navigate(initialView, nextDate);
  }

  function togglePerson(personId: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  }

  function openCreate(prefill: AppointmentFormPrefill) {
    setFormState((prev) => ({
      open: true,
      key: prev.key + 1,
      appointment: null,
      prefill,
    }));
  }

  function openEdit(appointment: AppointmentDto) {
    setDetailAppointment(null);
    setFormState((prev) => ({
      open: true,
      key: prev.key + 1,
      appointment,
      prefill: { date: initialDate },
    }));
  }

  function handleSaved(saved: AppointmentDto) {
    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      return exists
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [...prev, saved];
    });
    setFormState((prev) => ({ ...prev, open: false }));
    router.refresh();
  }

  function handleUpdated(updated: AppointmentDto) {
    setAppointments((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setDetailAppointment(updated);
    router.refresh();
  }

  function handleDeleted(id: string) {
    setAppointments((prev) => prev.filter((item) => item.id !== id));
    setDetailAppointment(null);
    router.refresh();
  }

  const periodLabel =
    initialView === "day"
      ? formatDateHeader(initialDate, timezone)
      : initialView === "week"
        ? formatWeekRangeHeader(initialDate, timezone)
        : formatMonthHeader(initialDate, timezone);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Calendar
        </h1>
        <Button type="button" onClick={() => openCreate({ date: initialDate })}>
          <PlusIcon className="size-4" />
          New appointment
        </Button>
      </div>

      <CalendarToolbar
        view={initialView}
        dateKey={initialDate}
        todayKey={todayKey}
        periodLabel={periodLabel}
        people={people}
        selectedPersonIds={selectedPersonIds}
        onStepPeriod={stepPeriod}
        onJumpToDate={(date) => navigate(initialView, date)}
        onChangeView={(view) => navigate(view, initialDate)}
        onTogglePerson={togglePerson}
        onClearPeople={() => setSelectedPersonIds([])}
      />

      {initialView === "day" && (
        <DayView
          dateKey={initialDate} timezone={timezone} businessHours={businessHours}
          people={visiblePeople} appointments={visibleAppointments}
          customers={customers} services={services}
          onSelectAppointment={setDetailAppointment} onCreateAtSlot={openCreate}
        />
      )}

      {initialView === "week" && (
        <WeekView
          dateKey={initialDate} todayKey={todayKey} timezone={timezone} businessHours={businessHours}
          people={visiblePeople} appointments={visibleAppointments}
          customers={customers} services={services}
          onSelectAppointment={setDetailAppointment} onCreateAtSlot={openCreate}
          onSelectDay={(day) => navigate("day", day)}
        />
      )}

      {initialView === "month" && (
        <MonthView
          key={initialDate}
          dateKey={initialDate} todayKey={todayKey} timezone={timezone} businessHours={businessHours}
          people={visiblePeople} appointments={visibleAppointments}
          customers={customers} services={services}
          onSelectAppointment={setDetailAppointment}
          onOpenDay={(day) => navigate("day", day)}
        />
      )}

      <AppointmentDetailDialog
        appointment={detailAppointment} timezone={timezone}
        people={people} customers={customers} services={services}
        onClose={() => setDetailAppointment(null)}
        onEdit={openEdit} onUpdated={handleUpdated} onDeleted={handleDeleted}
      />

      <AppointmentFormDialog
        key={formState.key} open={formState.open}
        appointment={formState.appointment} prefill={formState.prefill}
        timezone={timezone} businessHours={businessHours}
        people={people} customers={customers} services={services}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
        onSaved={handleSaved}
      />
    </div>
  );
}
