"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  CatalogApiError,
  deleteCategory,
  deleteService,
  insertCategory,
  insertService,
  moveCategory,
  moveService,
  updateCategory,
  updateService,
  type CatalogErrorCode,
} from "./data-access";
import {
  CreateCategorySchema,
  CreateServiceSchema,
  DeleteCategorySchema,
  DeleteServiceSchema,
  MoveCategorySchema,
  MoveServiceSchema,
  UpdateCategorySchema,
  UpdateServiceSchema,
  type CategoryDto,
  type CreateCategoryInput,
  type CreateServiceInput,
  type DeleteCategoryInput,
  type DeleteServiceInput,
  type MoveCategoryInput,
  type MoveServiceInput,
  type ServiceDto,
  type UpdateCategoryInput,
  type UpdateServiceInput,
} from "./schemas";

export type CatalogActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: CatalogErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function toActionError<T>(error: unknown): CatalogActionResult<T> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid input",
      fieldErrors,
    };
  }

  if (error instanceof CatalogApiError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  return {
    ok: false,
    code: "UPSTREAM_ERROR",
    message: "An unexpected error occurred while processing the request",
  };
}

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<CatalogActionResult<CategoryDto>> {
  try {
    const validated = CreateCategorySchema.parse(input);
    const created = await insertCategory(validated);
    revalidatePath("/catalog");
    return { ok: true, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCategoryAction(
  input: UpdateCategoryInput,
): Promise<CatalogActionResult<CategoryDto>> {
  try {
    const validated = UpdateCategorySchema.parse(input);
    const updated = await updateCategory(validated);
    revalidatePath("/catalog");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCategoryAction(
  input: DeleteCategoryInput,
): Promise<CatalogActionResult<null>> {
  try {
    const validated = DeleteCategorySchema.parse(input);
    await deleteCategory(validated);
    revalidatePath("/catalog");
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveCategoryAction(
  input: MoveCategoryInput,
): Promise<CatalogActionResult<CategoryDto>> {
  try {
    const validated = MoveCategorySchema.parse(input);
    const moved = await moveCategory(validated);
    revalidatePath("/catalog");
    return { ok: true, data: moved };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createServiceAction(
  input: CreateServiceInput,
): Promise<CatalogActionResult<ServiceDto>> {
  try {
    const validated = CreateServiceSchema.parse(input);
    const created = await insertService(validated);
    revalidatePath("/catalog");
    return { ok: true, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateServiceAction(
  input: UpdateServiceInput,
): Promise<CatalogActionResult<ServiceDto>> {
  try {
    const validated = UpdateServiceSchema.parse(input);
    const updated = await updateService(validated);
    revalidatePath("/catalog");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteServiceAction(
  input: DeleteServiceInput,
): Promise<CatalogActionResult<null>> {
  try {
    const validated = DeleteServiceSchema.parse(input);
    await deleteService(validated);
    revalidatePath("/catalog");
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveServiceAction(
  input: MoveServiceInput,
): Promise<CatalogActionResult<ServiceDto>> {
  try {
    const validated = MoveServiceSchema.parse(input);
    const moved = await moveService(validated);
    revalidatePath("/catalog");
    return { ok: true, data: moved };
  } catch (error) {
    return toActionError(error);
  }
}
