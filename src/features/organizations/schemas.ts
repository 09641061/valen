import { z } from "zod";

export const BUSINESS_TYPES = [
  "Salon",
  "Barbershop",
  "Spa",
  "Clinic",
  "Advisory",
  "Other",
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC · UTC+00:00" },
  { value: "America/New_York", label: "New York · UTC-05:00" },
  { value: "America/Chicago", label: "Chicago · UTC-06:00" },
  { value: "America/Denver", label: "Denver · UTC-07:00" },
  { value: "America/Los_Angeles", label: "Los Angeles · UTC-08:00" },
  { value: "America/Mexico_City", label: "Mexico City · UTC-06:00" },
  { value: "America/Bogota", label: "Bogota · UTC-05:00" },
  { value: "America/Lima", label: "Lima · UTC-05:00" },
  { value: "America/Santiago", label: "Santiago · UTC-04:00" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires · UTC-03:00" },
  { value: "America/Sao_Paulo", label: "Sao Paulo · UTC-03:00" },
  { value: "Europe/London", label: "London · UTC+00:00" },
  { value: "Europe/Madrid", label: "Madrid · UTC+01:00" },
  { value: "Europe/Paris", label: "Paris · UTC+01:00" },
  { value: "Europe/Berlin", label: "Berlin · UTC+01:00" },
] as const;

export const TIMEZONES = TIMEZONE_OPTIONS.map((tz) => tz.value);

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DayKeySchema = z.enum(DAY_KEYS);
export type DayKey = z.infer<typeof DayKeySchema>;

const TimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM 24-hour format");

export const DayHoursSchema = z
  .object({
    is_open: z.boolean(),
    open_time: TimeStringSchema,
    close_time: TimeStringSchema,
  })
  .refine((val) => !val.is_open || val.open_time < val.close_time, {
    message: "Opening time must be before closing time",
    path: ["close_time"],
  });

export type DayHours = z.infer<typeof DayHoursSchema>;

export const BusinessHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

export type BusinessHours = z.infer<typeof BusinessHoursSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  business_type: z.string(),
  contact_email: z.string(),
  timezone: z.string(),
  currency_code: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  business_hours: BusinessHoursSchema,
  ai_instructions: z.string(),
  ai_enabled: z.boolean().default(false),
  whatsapp_phone_number: z.string().default(""),
  whatsapp_phone_number_id: z.string().default(""),
  whatsapp_enabled: z.boolean().default(false),
  version: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type OrganizationDto = z.infer<typeof OrganizationSchema>;

export const UpdateBusinessDetailsSchema = z.object({
  version: z.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name must not exceed 120 characters"),
  contact_email: z
    .string()
    .trim()
    .min(5, "Contact email must be at least 5 characters")
    .max(254, "Contact email must not exceed 254 characters")
    .email("Enter a valid email address"),
  timezone: z.string().trim().min(1, "Timezone is required").max(120),
  currency_code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Invalid currency code (e.g. USD, PEN, EUR)"),
});

export type UpdateBusinessDetailsInput = z.infer<
  typeof UpdateBusinessDetailsSchema
>;

export type BusinessDetailsFieldErrors = Partial<
  Record<"name" | "contact_email" | "timezone" | "currency_code", string>
>;

export function validateBusinessDetails(
  input: UpdateBusinessDetailsInput,
): BusinessDetailsFieldErrors {
  const parsed = UpdateBusinessDetailsSchema.safeParse(input);
  if (parsed.success) return {};
  const errors: BusinessDetailsFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (
      (key === "name" ||
        key === "contact_email" ||
        key === "timezone" ||
        key === "currency_code") &&
      !errors[key]
    ) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export const UpdateBusinessHoursSchema = z.object({
  version: z.number().int().positive(),
  business_hours: BusinessHoursSchema,
});

export type UpdateBusinessHoursInput = z.infer<
  typeof UpdateBusinessHoursSchema
>;

export const UpdateAiInstructionsSchema = z.object({
  version: z.number().int().positive(),
  ai_instructions: z
    .string()
    .max(4000, "Assistant instructions must not exceed 4000 characters"),
  ai_enabled: z.boolean(),
});

export type UpdateAiInstructionsInput = z.infer<
  typeof UpdateAiInstructionsSchema
>;

const WHATSAPP_E164_REGEX = /^\+[1-9][0-9]{6,14}$/;
const WHATSAPP_PHONE_ID_REGEX = /^[0-9]{1,64}$/;

export const UpdateWhatsAppConfigSchema = z
  .object({
    version: z.number().int().positive(),
    whatsapp_enabled: z.boolean(),
    whatsapp_phone_number: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s\-()]/g, "")),
    whatsapp_phone_number_id: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    if (
      val.whatsapp_phone_number.length > 0 &&
      !WHATSAPP_E164_REGEX.test(val.whatsapp_phone_number)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp_phone_number"],
        message: "Enter a valid E.164 phone number starting with +",
      });
    }
    if (
      val.whatsapp_phone_number_id.length > 0 &&
      !WHATSAPP_PHONE_ID_REGEX.test(val.whatsapp_phone_number_id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp_phone_number_id"],
        message: "Phone Number ID must contain digits only",
      });
    }
    if (val.whatsapp_enabled) {
      if (val.whatsapp_phone_number.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp_phone_number"],
          message: "WhatsApp number is required when enabled",
        });
      }
      if (val.whatsapp_phone_number_id.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp_phone_number_id"],
          message: "Phone Number ID is required when enabled",
        });
      }
    }
  });

export type UpdateWhatsAppConfigInput = z.input<
  typeof UpdateWhatsAppConfigSchema
>;
