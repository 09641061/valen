import { z } from "zod";

const trimmedNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Maximum 120 characters");

const serviceDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Maximum 2000 characters");

const durationMinutesSchema = z
  .number()
  .int("Duration must be an integer")
  .min(1, "Minimum duration is 1 minute")
  .max(1440, "Maximum duration is 1440 minutes");

const priceMinorUnitsSchema = z
  .number()
  .int("Price must be expressed in integer minor units")
  .min(0, "Price cannot be negative");

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Invalid currency code (e.g. USD, COP, EUR)");

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: trimmedNameSchema,
  description: z.string().max(2000),
  duration_minutes: durationMinutesSchema,
  price_minor_units: priceMinorUnitsSchema,
  currency_code: z.string().regex(/^[A-Z]{3}$/),
  sort_order: z.number().int().min(1),
  version: z.number().int().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: trimmedNameSchema,
  sort_order: z.number().int().min(1),
  version: z.number().int().min(1),
  created_at: z.string(),
  updated_at: z.string(),
  services: z.array(ServiceSchema).default([]),
});

export const CatalogSchema = z.array(CategorySchema);

export const CreateCategorySchema = z.object({
  name: trimmedNameSchema,
});

export const UpdateCategorySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
  name: trimmedNameSchema,
});

export const DeleteCategorySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
});

export const MoveCategorySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
  sort_order: z.number().int().min(1),
});

export const CreateServiceSchema = z.object({
  category_id: z.string().uuid(),
  name: trimmedNameSchema,
  description: serviceDescriptionSchema,
  duration_minutes: durationMinutesSchema,
  price_minor_units: priceMinorUnitsSchema,
  currency_code: currencyCodeSchema,
  sort_order: z.number().int().min(1).optional(),
});

export const UpdateServiceSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
  name: trimmedNameSchema,
  description: serviceDescriptionSchema,
  duration_minutes: durationMinutesSchema,
  price_minor_units: priceMinorUnitsSchema,
  currency_code: currencyCodeSchema,
});

export const DeleteServiceSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
});

export const MoveServiceSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
  category_id: z.string().uuid(),
  sort_order: z.number().int().min(1),
});

export type ServiceDto = z.infer<typeof ServiceSchema>;
export type CategoryDto = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>;
export type MoveCategoryInput = z.infer<typeof MoveCategorySchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
export type DeleteServiceInput = z.infer<typeof DeleteServiceSchema>;
export type MoveServiceInput = z.infer<typeof MoveServiceSchema>;
