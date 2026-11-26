import type { CalendarViewMode } from "./schemas";

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeHHMM(value: string): boolean {
  return TIME_HHMM_REGEX.test(value);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getZonedParts(
  date: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const raw = parts.find((part) => part.type === type)?.value ?? "0";
    return Number.parseInt(raw, 10);
  };
  const hour = read("hour");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: hour === 24 ? 0 : hour,
    minute: read("minute"),
    second: read("second"),
  };
}

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_REGEX.test(value)) return false;
  const [y, m, d] = value.split("-").map((n) => Number.parseInt(n, 10));
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === m - 1 &&
    check.getUTCDate() === d
  );
}

export function getTodayDateKey(timezone: string, now = new Date()): string {
  const parts = getZonedParts(now, timezone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

export function addMonths(dateKey: string, months: number): string {
  const [y, m, d] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const targetMonth = new Date(Date.UTC(y, m - 1 + months, 1));
  const maxDay = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(d, maxDay);
  return `${targetMonth.getUTCFullYear()}-${pad2(targetMonth.getUTCMonth() + 1)}-${pad2(clampedDay)}`;
}

export function getWeekDays(dateKey: string): string[] {
  const [y, m, d] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const offsetFromMonday = (dayOfWeek + 6) % 7;
  const monday = addDays(dateKey, -offsetFromMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getMonthGridDays(dateKey: string): string[] {
  const [y, m] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const firstOfMonth = `${y}-${pad2(m)}-01`;
  const lastDayNum = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lastOfMonth = `${y}-${pad2(m)}-${pad2(lastDayNum)}`;

  const startDayOfWeek = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const leadingDays = (startDayOfWeek + 6) % 7;
  const gridStart = addDays(firstOfMonth, -leadingDays);

  const endDayOfWeek = new Date(Date.UTC(y, m - 1, lastDayNum)).getUTCDay();
  const trailingDays = (7 - ((endDayOfWeek + 6) % 7) - 1 + 7) % 7;
  const gridEnd = addDays(lastOfMonth, trailingDays);

  const days: string[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function zonedDateTimeToUtcIso(
  dateKey: string,
  timeHHMM: string,
  timezone: string,
): string {
  const [y, m, d] = dateKey.split("-").map((n) => Number.parseInt(n, 10));
  const [hh, mm] = timeHHMM.split(":").map((n) => Number.parseInt(n, 10));
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0, 0);

  const firstParts = getZonedParts(new Date(utcGuess), timezone);
  const firstWall = Date.UTC(
    firstParts.year,
    firstParts.month - 1,
    firstParts.day,
    firstParts.hour,
    firstParts.minute,
    firstParts.second,
  );
  const adjusted = utcGuess - (firstWall - utcGuess);

  const secondParts = getZonedParts(new Date(adjusted), timezone);
  const secondWall = Date.UTC(
    secondParts.year,
    secondParts.month - 1,
    secondParts.day,
    secondParts.hour,
    secondParts.minute,
    secondParts.second,
  );
  const finalUtc = adjusted - (secondWall - utcGuess);
  return new Date(finalUtc).toISOString();
}

export function getViewRange(
  view: CalendarViewMode,
  dateKey: string,
  timezone: string,
): { from: string; to: string } {
  let startKey = dateKey;
  let endKey = dateKey;
  if (view === "week") {
    const days = getWeekDays(dateKey);
    startKey = days[0];
    endKey = days[days.length - 1];
  } else if (view === "month") {
    const days = getMonthGridDays(dateKey);
    startKey = days[0];
    endKey = days[days.length - 1];
  }
  const from = zonedDateTimeToUtcIso(startKey, "00:00", timezone);
  const to = zonedDateTimeToUtcIso(addDays(endKey, 1), "00:00", timezone);
  return { from, to };
}

export function getAppointmentLocalDateKey(
  isoString: string,
  timezone: string,
): string {
  const parts = getZonedParts(new Date(isoString), timezone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatAppointmentTime(
  isoString: string,
  timezone: string,
): string {
  const parts = getZonedParts(new Date(isoString), timezone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function getAppointmentMinutesFromMidnight(
  isoString: string,
  timezone: string,
): number {
  const parts = getZonedParts(new Date(isoString), timezone);
  return parts.hour * 60 + parts.minute;
}

export function addMinutesToIso(isoString: string, minutes: number): string {
  const ms = new Date(isoString).getTime() + minutes * 60_000;
  return new Date(ms).toISOString();
}

export function formatDateHeader(dateKey: string, timezone: string): string {
  const iso = zonedDateTimeToUtcIso(dateKey, "12:00", timezone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatMonthHeader(dateKey: string, timezone: string): string {
  const iso = zonedDateTimeToUtcIso(dateKey, "12:00", timezone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatWeekRangeHeader(
  dateKey: string,
  timezone: string,
): string {
  const days = getWeekDays(dateKey);
  const startIso = zonedDateTimeToUtcIso(days[0], "12:00", timezone);
  const endIso = zonedDateTimeToUtcIso(days[6], "12:00", timezone);
  const startStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  }).format(new Date(startIso));
  const endStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(endIso));
  return `${startStr} – ${endStr}`;
}

export { getDayHoursForDate, getGridHourBounds, isWithinBusinessHours } from "./business-hours";

export function formatShortWeekday(dateKey: string, timezone: string): string {
  const iso = zonedDateTimeToUtcIso(dateKey, "12:00", timezone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(new Date(iso));
}
