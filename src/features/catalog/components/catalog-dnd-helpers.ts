import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { CategoryDto, ServiceDto } from "../schemas";
import { parseDndId } from "./dnd-ids";

export const catalogCollisionDetection: CollisionDetection = (args) => {
  const activeParsed = parseDndId(String(args.active.id));
  if (!activeParsed) {
    return closestCorners(args);
  }

  if (activeParsed.kind === "category") {
    const categoryContainers = args.droppableContainers.filter(
      (container) => parseDndId(String(container.id))?.kind === "category",
    );
    return closestCorners({
      ...args,
      droppableContainers: categoryContainers,
    });
  }

  if (activeParsed.kind === "service") {
    const serviceAndDropContainers = args.droppableContainers.filter(
      (container) => {
        const kind = parseDndId(String(container.id))?.kind;
        return kind === "service" || kind === "category-drop";
      },
    );

    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: serviceAndDropContainers,
    });

    if (pointerCollisions.length > 0) {
      const serviceCollisions = pointerCollisions.filter(
        (collision) => parseDndId(String(collision.id))?.kind === "service",
      );
      return serviceCollisions.length > 0
        ? serviceCollisions
        : pointerCollisions;
    }

    return closestCorners({
      ...args,
      droppableContainers: serviceAndDropContainers,
    });
  }

  return closestCorners(args);
};

export function findServiceById(
  categories: CategoryDto[],
  serviceId: string,
): ServiceDto | undefined {
  for (const cat of categories) {
    const found = cat.services.find((s) => s.id === serviceId);
    if (found) return found;
  }
  return undefined;
}

export function findCategoryByServiceId(
  categories: CategoryDto[],
  serviceId: string,
): CategoryDto | undefined {
  return categories.find((c) => c.services.some((s) => s.id === serviceId));
}

export function resolveOverServiceTarget(
  categories: CategoryDto[],
  overParsed: NonNullable<ReturnType<typeof parseDndId>>,
): { targetCategoryId: string; targetSortOrder: number } | null {
  if (overParsed.kind === "service") {
    for (const cat of categories) {
      const idx = cat.services.findIndex((s) => s.id === overParsed.id);
      if (idx !== -1) {
        return { targetCategoryId: cat.id, targetSortOrder: idx + 1 };
      }
    }
    return null;
  }

  if (overParsed.kind !== "category" && overParsed.kind !== "category-drop") {
    return null;
  }

  const targetCat = categories.find((c) => c.id === overParsed.id);
  if (!targetCat) return null;

  return {
    targetCategoryId: targetCat.id,
    targetSortOrder: targetCat.services.length + 1,
  };
}

export function resolveServiceDropTarget(
  categories: CategoryDto[],
  draggedService: ServiceDto,
  overParsed: NonNullable<ReturnType<typeof parseDndId>>,
): { targetCategoryId: string; targetSortOrder: number } | null {
  if (overParsed.kind === "service") {
    if (overParsed.id === draggedService.id) {
      return {
        targetCategoryId: draggedService.category_id,
        targetSortOrder: draggedService.sort_order,
      };
    }
    return resolveOverServiceTarget(categories, overParsed);
  }

  if (overParsed.kind !== "category" && overParsed.kind !== "category-drop") {
    return null;
  }

  const targetCat = categories.find((c) => c.id === overParsed.id);
  if (!targetCat) return null;

  const targetSortOrder =
    draggedService.category_id === targetCat.id
      ? Math.max(1, targetCat.services.length)
      : targetCat.services.length + 1;
  return { targetCategoryId: targetCat.id, targetSortOrder };
}

export function resolveCategoryDropTarget(
  categories: CategoryDto[],
  draggedId: string,
  overParsed: NonNullable<ReturnType<typeof parseDndId>>,
): { draggedCategory: CategoryDto; targetSortOrder: number } | null {
  const draggedCategory = categories.find((c) => c.id === draggedId);
  if (!draggedCategory) return null;

  const targetCategoryId =
    overParsed.kind === "category" || overParsed.kind === "category-drop"
      ? overParsed.id
      : categories.find((c) => c.services.some((s) => s.id === overParsed.id))
          ?.id;

  if (!targetCategoryId || targetCategoryId === draggedCategory.id) {
    return null;
  }

  const targetCategory = categories.find((c) => c.id === targetCategoryId);
  if (!targetCategory) return null;

  return { draggedCategory, targetSortOrder: targetCategory.sort_order };
}
