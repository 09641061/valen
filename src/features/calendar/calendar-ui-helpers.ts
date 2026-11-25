import { isWithinBusinessHours } from "./business-hours";
import {
  formatAppointmentTime,
  getAppointmentLocalDateKey,
  isValidDateKey,
  isValidTimeHHMM,
} from "./date-utils";
import type {
  AppointmentDto,
  AppointmentStatus,
  CalendarBusinessHours,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "./schemas";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  no_show: "border-orange-200 bg-orange-50 text-orange-800",
};

export const STATUS_DOT_CLASSES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  completed: "bg-slate-400",
  cancelled: "bg-rose-400",
  no_show: "bg-orange-500",
};

export function formatChannelLabel(channel: string): string {
  if (channel.toLowerCase() === "whatsapp") return "WhatsApp";
  if (channel.toLowerCase() === "manual") return "Manual";
  return channel || "Manual";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function resolveCustomerName(
  appointment: AppointmentDto,
  customers: CalendarCustomerOption[],
): string {
  if (appointment.customer_name) return appointment.customer_name;
  return (
    customers.find((c) => c.id === appointment.customer_id)?.name ??
    "Customer"
  );
}

export function resolveServiceName(
  appointment: AppointmentDto,
  services: CalendarServiceOption[],
): string {
  if (appointment.service_name) return appointment.service_name;
  return (
    services.find((s) => s.id === appointment.service_id)?.name ?? "Service"
  );
}

export function resolvePersonName(
  appointment: AppointmentDto,
  people: CalendarPersonDto[],
): string {
  if (appointment.person_name) return appointment.person_name;
  return people.find((p) => p.id === appointment.person_id)?.name ?? "Staff";
}

export const DAY_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00
export const HOUR_HEIGHT_PX = 96;
export const MIN_APPOINTMENT_CARD_HEIGHT_PX = 72;

export interface PersonAccent {
  dot: string;
  border: string;
  pill: string;
  avatar: string;
}

const PERSON_ACCENTS: PersonAccent[] = [
  {
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    pill: "bg-emerald-50/90 text-emerald-950 hover:bg-emerald-100",
    avatar: "bg-emerald-50 text-emerald-700",
  },
  {
    dot: "bg-sky-500",
    border: "border-l-sky-500",
    pill: "bg-sky-50/90 text-sky-950 hover:bg-sky-100",
    avatar: "bg-sky-50 text-sky-700",
  },
  {
    dot: "bg-violet-500",
    border: "border-l-violet-500",
    pill: "bg-violet-50/90 text-violet-950 hover:bg-violet-100",
    avatar: "bg-violet-50 text-violet-700",
  },
  {
    dot: "bg-amber-500",
    border: "border-l-amber-500",
    pill: "bg-amber-50/90 text-amber-950 hover:bg-amber-100",
    avatar: "bg-amber-50 text-amber-700",
  },
  {
    dot: "bg-rose-500",
    border: "border-l-rose-500",
    pill: "bg-rose-50/90 text-rose-950 hover:bg-rose-100",
    avatar: "bg-rose-50 text-rose-700",
  },
  {
    dot: "bg-teal-500",
    border: "border-l-teal-500",
    pill: "bg-teal-50/90 text-teal-950 hover:bg-teal-100",
    avatar: "bg-teal-50 text-teal-700",
  },
];

export function getPersonAccent(
  personId: string,
  people: CalendarPersonDto[],
): PersonAccent {
  const index = people.findIndex((p) => p.id === personId);
  if (index >= 0) {
    return PERSON_ACCENTS[index % PERSON_ACCENTS.length];
  }
  let hash = 0;
  for (let i = 0; i < personId.length; i += 1) {
    hash = (hash * 31 + personId.charCodeAt(i)) >>> 0;
  }
  return PERSON_ACCENTS[hash % PERSON_ACCENTS.length];
}

export function getInitialAppointmentFields(
  appointment: AppointmentDto | null,
  prefill: { date: string; time?: string; personId?: string; customerId?: string },
  timezone: string,
  people: CalendarPersonDto[],
  customers: CalendarCustomerOption[],
  services: CalendarServiceOption[],
) {
  if (appointment) {
    return {
      customerId: appointment.customer_id,
      serviceId: appointment.service_id,
      personId: appointment.person_id,
      date: getAppointmentLocalDateKey(appointment.starts_at, timezone),
      time: formatAppointmentTime(appointment.starts_at, timezone),
      notes: appointment.notes,
    };
  }
  return {
    customerId: prefill.customerId ?? customers[0]?.id ?? "",
    serviceId: services[0]?.id ?? "",
    personId: prefill.personId ?? people[0]?.id ?? "",
    date: prefill.date,
    time: prefill.time ?? "09:00",
    notes: "",
  };
}

export function mapAppointmentSaveError(code: string, message: string) {
  if (code === "CONFLICT") return { title: "Time slot conflict", message };
  if (code === "STALE_VERSION") {
    return {
      title: "Outdated appointment",
      message: "This appointment was modified by someone else. Close and refresh to try again.",
    };
  }
  return { title: "Could not save appointment", message };
}

export function validateAppointmentForm(input: {
  customerId: string;
  serviceId: string;
  personId: string;
  date: string;
  time: string;
  durationMinutes: number;
  businessHours?: CalendarBusinessHours | null;
}): { title: string; message: string } | null {
  if (!input.customerId || !input.serviceId || !input.personId || !input.date || !input.time) {
    return {
      title: "Missing fields",
      message: "Please select a customer, service, person, date, and time.",
    };
  }
  if (!isValidDateKey(input.date) || !isValidTimeHHMM(input.time)) {
    return {
      title: "Invalid date or time",
      message: "Enter a valid date (YYYY-MM-DD) and time (HH:MM).",
    };
  }
  const hoursCheck = isWithinBusinessHours(
    input.date,
    input.time,
    input.durationMinutes,
    input.businessHours,
  );
  if (!hoursCheck.valid) {
    return { title: "Outside business hours", message: hoursCheck.reason };
  }
  return null;
}

export function getAppointmentDialogCopy(isEdit: boolean, isPending: boolean) {
  return {
    title: isEdit ? "Edit / Reschedule appointment" : "New appointment",
    description: isEdit
      ? "Update the service, time, or assigned person."
      : "Schedule a new appointment for a customer.",
    submitLabel: isPending
      ? "Saving..."
      : isEdit
        ? "Save changes"
        : "Create appointment",
  };
}
