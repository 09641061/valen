import "server-only";

import {
  ServiceSchema,
  type CreateServiceInput,
  type DeleteServiceInput,
  type MoveServiceInput,
  type ServiceDto,
  type UpdateServiceInput,
} from "../schemas";
import { cynthiaFetch, formatIfMatchHeader } from "./client";

/**
 * Creates a new service inside a category.
 */
export async function insertService(
  input: CreateServiceInput,
): Promise<ServiceDto> {
  const body: Record<string, unknown> = {
    name: input.name,
    duration_minutes: input.duration_minutes,
    price_minor_units: input.price_minor_units,
  };
  if (input.sort_order !== undefined) {
    body.sort_order = input.sort_order;
  }

  const response = await cynthiaFetch(
    `/v1/catalog/categories/${input.category_id}/services`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json();
  return ServiceSchema.parse(payload);
}

/**
 * Updates an existing service's details using optimistic concurrency.
 */
export async function updateService(
  input: UpdateServiceInput,
): Promise<ServiceDto> {
  const response = await cynthiaFetch(`/v1/catalog/services/${input.id}`, {
    method: "PUT",
    headers: {
      "If-Match": formatIfMatchHeader(input.version),
    },
    body: JSON.stringify({
      name: input.name,
      duration_minutes: input.duration_minutes,
      price_minor_units: input.price_minor_units,
    }),
  });
  const payload = await response.json();
  return ServiceSchema.parse(payload);
}

/**
 * Deletes a service using optimistic concurrency.
 */
export async function deleteService(input: DeleteServiceInput): Promise<void> {
  await cynthiaFetch(`/v1/catalog/services/${input.id}`, {
    method: "DELETE",
    headers: {
      "If-Match": formatIfMatchHeader(input.version),
    },
  });
}

/**
 * Moves a service within its category or to another category using optimistic concurrency.
 */
export async function moveService(input: MoveServiceInput): Promise<ServiceDto> {
  const response = await cynthiaFetch(
    `/v1/catalog/services/${input.id}/placement`,
    {
      method: "PUT",
      headers: {
        "If-Match": formatIfMatchHeader(input.version),
      },
      body: JSON.stringify({
        category_id: input.category_id,
        sort_order: input.sort_order,
      }),
    },
  );
  const payload = await response.json();
  return ServiceSchema.parse(payload);
}
