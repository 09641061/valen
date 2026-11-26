import "server-only";

import {
  CatalogSchema,
  CategorySchema,
  type CategoryDto,
  type CreateCategoryInput,
  type DeleteCategoryInput,
  type MoveCategoryInput,
  type UpdateCategoryInput,
} from "../schemas";
import { cynthiaFetch } from "./client";

function sortCatalog(categories: CategoryDto[]): CategoryDto[] {
  return [...categories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      ...category,
      services: [...category.services].sort((a, b) => a.sort_order - b.sort_order),
    }));
}

/**
 * Fetches the full ordered catalog of categories and services from Cynthia.
 */
export async function fetchCatalog(): Promise<CategoryDto[]> {
  const response = await cynthiaFetch("/v1/catalog", { method: "GET" });
  const payload = await response.json();
  const parsed = CatalogSchema.parse(payload);
  return sortCatalog(parsed);
}

/**
 * Creates a new catalog category.
 */
export async function insertCategory(
  input: CreateCategoryInput,
): Promise<CategoryDto> {
  const response = await cynthiaFetch("/v1/catalog/categories", {
    method: "POST",
    body: JSON.stringify({ name: input.name }),
  });
  const payload = await response.json();
  return CategorySchema.parse(payload);
}

/**
 * Updates an existing category's name using optimistic concurrency.
 */
export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<CategoryDto> {
  const response = await cynthiaFetch(`/v1/catalog/categories/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: input.name }),
  });
  const payload = await response.json();
  return CategorySchema.parse(payload);
}

/**
 * Deletes a category.
 */
export async function deleteCategory(input: DeleteCategoryInput): Promise<void> {
  await cynthiaFetch(`/v1/catalog/categories/${input.id}`, {
    method: "DELETE",
  });
}

/**
 * Reorders a category to a new 1-based sort_order.
 */
export async function moveCategory(
  input: MoveCategoryInput,
): Promise<CategoryDto> {
  const response = await cynthiaFetch(
    `/v1/catalog/categories/${input.id}/placement`,
    {
      method: "PUT",
      body: JSON.stringify({ sort_order: input.sort_order }),
    },
  );
  const payload = await response.json();
  return CategorySchema.parse(payload);
}
