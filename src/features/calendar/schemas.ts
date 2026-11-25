import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const AppointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const CalendarViewModeSchema = z.enum(["day", "week", "month"]);
export type CalendarViewMode = z.infer<typeof CalendarViewModeSchema>;

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface CalendarDayHours {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export type CalendarBusinessHours = Record<WeekdayKey, CalendarDayHours>;

export const CalendarPersonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  email: z.string().optional().default(""),
  role_label: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
});

export type CalendarPersonDto = z.infer<typeof CalendarPersonSchema>;

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  customer_name: z.string().optional().default(""),
  customer_phone: z.string().optional().default(""),
  service_id: z.string().uuid(),
  service_name: z.string().optional().default(""),
  person_id: z.string().uuid(),
  person_name: z.string().optional().default(""),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  status: AppointmentStatusSchema,
  channel: z.string().optional().default("manual"),
  notes: z.string().optional().default(""),
  created_at: z.string().optional().default(""),
  updated_at: z.string().optional().default(""),
});

export type AppointmentDto = z.infer<typeof AppointmentSchema>;

const NotesSchema = z
  .string()
  .trim()
  .max(1000, "Notes must be 1000 characters or fewer")
  .optional()
  .default("");

export const CreateAppointmentSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  service_id: z.string().uuid("Select a service"),
  person_id: z.string().uuid("Select a person"),
  starts_at: z.string().min(1, "Start time is required"),
  ends_at: z.string().min(1, "End time is required"),
  notes: NotesSchema,
  channel: z.enum(["manual", "whatsapp"]).optional().default("manual"),
});

export type CreateAppointmentInput = z.input<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid("Select a customer").optional(),
  service_id: z.string().uuid("Select a service").optional(),
  person_id: z.string().uuid("Select a person").optional(),
  starts_at: z.string().min(1, "Start time is required").optional(),
  ends_at: z.string().min(1, "End time is required").optional(),
  status: AppointmentStatusSchema.optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer")
    .optional(),
});

export type UpdateAppointmentInput = z.input<typeof UpdateAppointmentSchema>;

export const DeleteAppointmentSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteAppointmentInput = z.input<typeof DeleteAppointmentSchema>;

export interface CalendarServiceOption {
  id: string;
  name: string;
  duration_minutes: number;
  category_name?: string;
}

export interface CalendarCustomerOption {
  id: string;
  name: string;
  phone: string;
}
