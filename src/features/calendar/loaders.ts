import "server-only";

import { cache } from "react";
import {
  fetchAppointment,
  fetchAppointments,
  fetchCalendarPeople,
  type FetchAppointmentsParams,
} from "./data-access";
import type { AppointmentDto, CalendarPersonDto } from "./schemas";

export interface CalendarData {
  people: CalendarPersonDto[];
  appointments: AppointmentDto[];
}

/**
 * Request-memoized loader for bookable people and appointments in a date range.
 */
export const getCalendarData = cache(
  async (params: FetchAppointmentsParams): Promise<CalendarData> => {
    const [people, appointments] = await Promise.all([
      fetchCalendarPeople(),
      fetchAppointments(params),
    ]);
    return { people, appointments };
  },
);

/**
 * Request-memoized loader for a single appointment by ID.
 */
export const getAppointment = cache(
  async (id: string): Promise<AppointmentDto> => {
    return fetchAppointment(id);
  },
);
