import type { CategoryDto, ServiceDto } from "./schemas";

/**
 * Formats minor currency units (e.g. 2500 USD -> "$25.00" or "25,00 US$").
 */
export function formatPrice(minorUnits: number, currencyCode: string): string {
  const majorUnits = minorUnits / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(majorUnits);
  } catch {
    return `${majorUnits.toFixed(2)} ${currencyCode}`;
  }
}

/**
 * Converts a user-entered decimal price string (e.g. "25.50" or "25,50") to integer minor units.
 */
export function parsePriceToMinorUnits(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

/**
 * Formats integer minor units as a decimal string suitable for numeric input fields.
 */
export function formatMinorUnitsToInput(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

/**
 * Formats service duration in minutes into a concise English label.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainder} min`;
}

function renumberServices(services: ServiceDto[], categoryId: string): ServiceDto[] {
  return services.map((service, index) => ({
    ...service,
    category_id: categoryId,
    sort_order: index + 1,
  }));
}

/**
 * Computes the optimistic category list after moving a category to a 1-based sort_order.
 */
export function applyOptimisticCategoryMove(
  categories: CategoryDto[],
  categoryId: string,
  targetSortOrder: number,
): CategoryDto[] {
  const sourceIndex = categories.findIndex((c) => c.id === categoryId);
  if (sourceIndex === -1) {
    return categories;
  }

  const next = [...categories];
  const [moved] = next.splice(sourceIndex, 1);
  const targetIndex = Math.max(0, Math.min(targetSortOrder - 1, next.length));
  next.splice(targetIndex, 0, moved);

  return next.map((category, index) => ({
    ...category,
    sort_order: index + 1,
  }));
}

/**
 * Computes the optimistic category list after moving a service within or across categories.
 */
export function applyOptimisticServiceMove(
  categories: CategoryDto[],
  serviceId: string,
  targetCategoryId: string,
  targetSortOrder: number,
): CategoryDto[] {
  let movedService: ServiceDto | undefined;
  let sourceCategoryId: string | undefined;

  for (const category of categories) {
    const found = category.services.find((s) => s.id === serviceId);
    if (found) {
      movedService = found;
      sourceCategoryId = category.id;
      break;
    }
  }

  if (!movedService || !sourceCategoryId) {
    return categories;
  }

  const targetExists = categories.some((c) => c.id === targetCategoryId);
  if (!targetExists) {
    return categories;
  }

  return categories.map((category) => {
    if (category.id === sourceCategoryId && category.id === targetCategoryId) {
      const remaining = category.services.filter((s) => s.id !== serviceId);
      const insertIndex = Math.max(0, Math.min(targetSortOrder - 1, remaining.length));
      remaining.splice(insertIndex, 0, movedService);
      return {
        ...category,
        services: renumberServices(remaining, category.id),
      };
    }

    if (category.id === sourceCategoryId) {
      const remaining = category.services.filter((s) => s.id !== serviceId);
      return {
        ...category,
        services: renumberServices(remaining, category.id),
      };
    }

    if (category.id === targetCategoryId) {
      const nextServices = [...category.services];
      const insertIndex = Math.max(0, Math.min(targetSortOrder - 1, nextServices.length));
      nextServices.splice(insertIndex, 0, {
        ...movedService,
        category_id: targetCategoryId,
      });
      return {
        ...category,
        services: renumberServices(nextServices, category.id),
      };
    }

    return category;
  });
}
