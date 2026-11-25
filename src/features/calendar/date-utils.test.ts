import { describe, expect, it } from "vitest";
import {
  addDays,
  addMinutesToIso,
  addMonths,
  formatAppointmentTime,
  getAppointmentLocalDateKey,
  getDayHoursForDate,
  getGridHourBounds,
  getMonthGridDays,
  getTodayDateKey,
  getViewRange,
  getWeekDays,
  isValidDateKey,
  isWithinBusinessHours,
  zonedDateTimeToUtcIso,
} from "./date-utils";
import type { AppointmentDto, CalendarBusinessHours } from "./schemas";

const SAMPLE_HOURS: CalendarBusinessHours = {
  monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  tuesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  wednesday: { is_open: true, open_time: "10:00", close_time: "17:00" },
  thursday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  friday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  saturday: { is_open: false, open_time: "09:00", close_time: "13:00" },
  sunday: { is_open: false, open_time: "09:00", close_time: "13:00" },
};

describe("calendar date-utils", () => {
  it("validates YYYY-MM-DD date keys", () => {
    expect(isValidDateKey("2026-11-24")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("24-11-2026")).toBe(false);
  });

  it("computes today date key in organization timezone", () => {
    const utcLateNight = new Date("2026-11-25T03:30:00.000Z");
    expect(getTodayDateKey("UTC", utcLateNight)).toBe("2026-11-25");
    expect(getTodayDateKey("America/Mexico_City", utcLateNight)).toBe("2026-11-24");
  });

  it("adds days and months accurately", () => {
    expect(addDays("2026-11-24", 7)).toBe("2026-12-01");
    expect(addDays("2026-11-24", -1)).toBe("2026-11-23");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("builds Mon-Sun week days and month grid", () => {
    const week = getWeekDays("2026-11-24"); // Tuesday
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-11-23");
    expect(week[6]).toBe("2026-11-29");

    const grid = getMonthGridDays("2026-11-24");
    expect(grid[0]).toBe("2026-10-26");
    expect(grid[grid.length - 1]).toBe("2026-12-06");
    expect(grid.length % 7).toBe(0);
  });

  it("converts zoned date/time to UTC ISO and back", () => {
    const iso = zonedDateTimeToUtcIso("2026-11-24", "09:30", "America/Bogota");
    expect(iso).toBe("2026-11-24T14:30:00.000Z");
    expect(formatAppointmentTime(iso, "America/Bogota")).toBe("09:30");
    expect(getAppointmentLocalDateKey(iso, "America/Bogota")).toBe("2026-11-24");
    expect(addMinutesToIso(iso, 45)).toBe("2026-11-24T15:15:00.000Z");
  });

  it("computes Day, Week, and Month view ranges in timezone", () => {
    const dayRange = getViewRange("day", "2026-11-24", "America/Bogota");
    expect(dayRange.from).toBe("2026-11-24T05:00:00.000Z");
    expect(dayRange.to).toBe("2026-11-25T05:00:00.000Z");

    const weekRange = getViewRange("week", "2026-11-24", "UTC");
    expect(weekRange.from).toBe("2026-11-23T00:00:00.000Z");
    expect(weekRange.to).toBe("2026-11-30T00:00:00.000Z");
  });

  it("resolves day hours and grid bounds from businessHours", () => {
    expect(getDayHoursForDate("2026-11-24", SAMPLE_HOURS)).toEqual({
      is_open: true,
      open_time: "09:00",
      close_time: "18:00",
    });
    expect(getDayHoursForDate("2026-11-28", SAMPLE_HOURS)?.is_open).toBe(false);
    expect(getDayHoursForDate("2026-11-24", null)).toBeNull();

    expect(getGridHourBounds(null, [])).toEqual({ startHour: 8, endHour: 20 });
    expect(getGridHourBounds(SAMPLE_HOURS, [])).toEqual({ startHour: 9, endHour: 18 });

    const earlyAppt = {
      starts_at: "2026-11-24T07:30:00.000Z",
      ends_at: "2026-11-24T19:30:00.000Z",
    } as AppointmentDto;
    expect(getGridHourBounds(SAMPLE_HOURS, [earlyAppt], "UTC")).toEqual({
      startHour: 7,
      endHour: 20,
    });
  });

  it("validates appointments against businessHours", () => {
    expect(isWithinBusinessHours("2026-11-24", "09:00", 45, SAMPLE_HOURS)).toEqual({
      valid: true,
    });
    expect(isWithinBusinessHours("2026-11-28", "10:00", 30, SAMPLE_HOURS)).toEqual({
      valid: false,
      reason: "Business is closed on this day.",
    });
    expect(isWithinBusinessHours("2026-11-24", "08:30", 30, SAMPLE_HOURS)).toEqual({
      valid: false,
      reason: "Appointments must be within business hours (09:00 – 18:00).",
    });
    expect(isWithinBusinessHours("2026-11-24", "17:30", 45, SAMPLE_HOURS)).toEqual({
      valid: false,
      reason: "Appointments must be within business hours (09:00 – 18:00).",
    });
  });
});
