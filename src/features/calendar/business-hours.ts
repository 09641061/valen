import type {
  AppointmentDto,
  CalendarBusinessHours,
  CalendarDayHours,
  WeekdayKey,
} from "./schemas";

const WEEKDAY_BY_UTC_DAY: readonly WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function parseMinutes(timeHHMM: string): number {
  const [hh, mm] = timeHHMM.split(":").map((n) => Number.parseInt(n, 10));
  return hh * 60 + mm;
}

function getZonedMinutes(isoString: string, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoString));
  const hourRaw = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minRaw = parts.find((p) => p.type === "minute")?.value ?? "0";
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minRaw, 10);
  return (hour === 24 ? 0 : hour) * 60 + minute;
}

export function getDayHoursForDate(
  dateKey: string,
  businessHours: CalendarBusinessHours | null | undefined,
): CalendarDayHours | null {
  if (!businessHours || !DATE_KEY_PATTERN.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  const weekday = WEEKDAY_BY_UTC_DAY[check.getUTCDay()];
  return businessHours[weekday] ?? null;
}

export function getGridHourBounds(
  businessHours: CalendarBusinessHours | null | undefined,
  appointments: AppointmentDto[],
  timezone = "UTC",
): { startHour: number; endHour: number } {
  let startHour = 8;
  let endHour = 20;

  if (businessHours) {
    const openDays = Object.values(businessHours).filter((d) => d.is_open);
    if (openDays.length > 0) {
      let minOpen = 24 * 60;
      let maxClose = 0;
      for (const day of openDays) {
        if (TIME_HHMM_PATTERN.test(day.open_time)) {
          minOpen = Math.min(minOpen, parseMinutes(day.open_time));
        }
        if (TIME_HHMM_PATTERN.test(day.close_time)) {
          maxClose = Math.max(maxClose, parseMinutes(day.close_time));
        }
      }
      if (minOpen < maxClose) {
        startHour = Math.floor(minOpen / 60);
        endHour = Math.min(23, Math.ceil(maxClose / 60));
      }
    }
  }

  for (const appt of appointments) {
    const apptStart = getZonedMinutes(appt.starts_at, timezone);
    const apptEnd = getZonedMinutes(appt.ends_at, timezone);
    startHour = Math.min(startHour, Math.floor(apptStart / 60));
    endHour = Math.max(endHour, Math.min(23, Math.ceil(apptEnd / 60)));
  }

  return {
    startHour: Math.max(0, startHour),
    endHour: Math.max(startHour, Math.min(23, endHour)),
  };
}

export function isWithinBusinessHours(
  dateKey: string,
  startTimeHHMM: string,
  durationMinutes: number,
  businessHours: CalendarBusinessHours | null | undefined,
): { valid: true } | { valid: false; reason: string } {
  if (!businessHours) return { valid: true };
  const dayHours = getDayHoursForDate(dateKey, businessHours);
  if (!dayHours) return { valid: true };
  if (!dayHours.is_open) {
    return { valid: false, reason: "Business is closed on this day." };
  }
  if (!TIME_HHMM_PATTERN.test(startTimeHHMM)) {
    return { valid: false, reason: "Enter a valid start time (HH:MM)." };
  }
  const startMins = parseMinutes(startTimeHHMM);
  const endMins = startMins + durationMinutes;
  const openMins = parseMinutes(dayHours.open_time);
  const closeMins = parseMinutes(dayHours.close_time);
  if (startMins < openMins || endMins > closeMins) {
    return {
      valid: false,
      reason: `Appointments must be within business hours (${dayHours.open_time} – ${dayHours.close_time}).`,
    };
  }
  return { valid: true };
}

export function isHourSlotOpen(
  hour: number,
  dayHours: CalendarDayHours | null,
): boolean {
  if (!dayHours) return true;
  if (!dayHours.is_open) return false;
  const openMins = parseMinutes(dayHours.open_time);
  const closeMins = parseMinutes(dayHours.close_time);
  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;
  return slotEnd > openMins && slotStart < closeMins;
}

export function buildTimeSlotsForDayHours(
  dayHours: CalendarDayHours | null,
): string[] {
  if (dayHours && !dayHours.is_open) return [];
  const startMins = dayHours ? parseMinutes(dayHours.open_time) : 8 * 60;
  const endMins = dayHours ? parseMinutes(dayHours.close_time) : 20 * 60 + 30;
  const slots: string[] = [];
  for (let mins = startMins; mins < endMins; mins += 30) {
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export function buildHourList(startHour: number, endHour: number): number[] {
  return Array.from(
    { length: Math.max(1, endHour - startHour + 1) },
    (_, i) => startHour + i,
  );
}
