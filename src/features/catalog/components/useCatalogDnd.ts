"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useTransition } from "react";
import { moveCategoryAction, moveServiceAction } from "../actions";
import type { CategoryDto, ServiceDto } from "../schemas";
import { parseDndId } from "./dnd-ids";

export type CatalogOptimisticAction =
  | { type: "move-category"; categoryId: string; targetSortOrder: number }
  | {
      type: "move-service";
      serviceId: string;
      targetCategoryId: string;
      targetSortOrder: number;
    };

interface UseCatalogDndOptions {
  categories: CategoryDto[];
  isFiltering: boolean;
  addOptimistic: (action: CatalogOptimisticAction) => void;
  onStaleVersion: (message: string) => void;
  onError: (message: string | null) => void;
  onSuccess: () => void;
}

export function useCatalogDnd({
  categories,
  isFiltering,
  addOptimistic,
  onStaleVersion,
  onError,
  onSuccess,
}: UseCatalogDndOptions) {
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const parsed = parseDndId(String(event.active.id));
    if (!parsed) return;

    if (parsed.kind === "category") {
      const cat = categories.find((c) => c.id === parsed.id);
      setActiveDragLabel(cat?.name ?? null);
      return;
    }

    if (parsed.kind === "service") {
      for (const cat of categories) {
        const svc = cat.services.find((s) => s.id === parsed.id);
        if (svc) {
          setActiveDragLabel(svc.name);
          break;
        }
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragLabel(null);
    if (isFiltering) return;

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeParsed = parseDndId(String(active.id));
    const overParsed = parseDndId(String(over.id));
    if (!activeParsed || !overParsed) {
      return;
    }

    if (activeParsed.kind === "category") {
      handleCategoryDrop(activeParsed.id, overParsed);
      return;
    }

    if (activeParsed.kind === "service") {
      handleServiceDrop(activeParsed.id, overParsed);
    }
  }

  function handleCategoryDrop(
    draggedId: string,
    overParsed: NonNullable<ReturnType<typeof parseDndId>>,
  ) {
    const draggedCategory = categories.find((c) => c.id === draggedId);
    if (!draggedCategory) return;

    const targetCategoryId =
      overParsed.kind === "category" || overParsed.kind === "category-drop"
        ? overParsed.id
        : categories.find((c) =>
            c.services.some((s) => s.id === overParsed.id),
          )?.id;

    if (!targetCategoryId || targetCategoryId === draggedCategory.id) {
      return;
    }

    const targetCategory = categories.find((c) => c.id === targetCategoryId);
    if (!targetCategory) return;

    const targetSortOrder = targetCategory.sort_order;
    onError(null);

    startTransition(async () => {
      addOptimistic({
        type: "move-category",
        categoryId: draggedCategory.id,
        targetSortOrder,
      });

      const result = await moveCategoryAction({
        id: draggedCategory.id,
        version: draggedCategory.version,
        sort_order: targetSortOrder,
      });

      if (!result.ok) {
        if (result.code === "STALE_VERSION") {
          onStaleVersion(result.message);
        } else {
          onError(result.message);
        }
        return;
      }

      onSuccess();
    });
  }

function findServiceById(
  categories: CategoryDto[],
  serviceId: string,
): ServiceDto | undefined {
  for (const cat of categories) {
    const found = cat.services.find((s) => s.id === serviceId);
    if (found) return found;
  }
  return undefined;
}

function resolveServiceDropTarget(
  categories: CategoryDto[],
  draggedService: ServiceDto,
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

  const targetSortOrder =
    draggedService.category_id === targetCat.id
      ? Math.max(1, targetCat.services.length)
      : targetCat.services.length + 1;
  return { targetCategoryId: targetCat.id, targetSortOrder };
}

  function handleServiceDrop(
    draggedId: string,
    overParsed: NonNullable<ReturnType<typeof parseDndId>>,
  ) {
    const draggedService = findServiceById(categories, draggedId);
    if (!draggedService) return;

    const target = resolveServiceDropTarget(categories, draggedService, overParsed);
    if (!target) return;

    const { targetCategoryId, targetSortOrder } = target;
    if (
      targetCategoryId === draggedService.category_id &&
      targetSortOrder === draggedService.sort_order
    ) {
      return;
    }

    onError(null);

    startTransition(async () => {
      addOptimistic({
        type: "move-service",
        serviceId: draggedService.id,
        targetCategoryId,
        targetSortOrder,
      });

      const result = await moveServiceAction({
        id: draggedService.id,
        version: draggedService.version,
        category_id: targetCategoryId,
        sort_order: targetSortOrder,
      });

      if (!result.ok) {
        if (result.code === "STALE_VERSION") {
          onStaleVersion(result.message);
        } else {
          onError(result.message);
        }
        return;
      }

      onSuccess();
    });
  }

  return {
    sensors,
    activeDragLabel,
    handleDragStart,
    handleDragEnd,
    handleDragCancel: () => setActiveDragLabel(null),
  };
}
