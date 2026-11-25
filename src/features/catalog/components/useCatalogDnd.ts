"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState, useTransition } from "react";
import {
  moveCategoryAction,
  moveServiceAction,
  type CatalogActionResult,
} from "../actions";
import { applyOptimisticServiceMove } from "../format";
import type { CategoryDto } from "../schemas";
import {
  catalogCollisionDetection,
  findCategoryByServiceId,
  findServiceById,
  resolveCategoryDropTarget,
  resolveOverServiceTarget,
  resolveServiceDropTarget,
} from "./catalog-dnd-helpers";
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
  const [activeDragKind, setActiveDragKind] = useState<"category" | "service" | null>(null);
  const [activeDragCategoryId, setActiveDragCategoryId] = useState<string | null>(null);
  const [previewCategories, setPreviewCategories] = useState<CategoryDto[] | null>(null);
  const dragOriginRef = useRef<CategoryDto[] | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function resetDragState() {
    dragOriginRef.current = null;
    setActiveDragLabel(null);
    setActiveDragKind(null);
    setActiveDragCategoryId(null);
    setPreviewCategories(null);
  }

  function handleActionResult<T>(result: CatalogActionResult<T>) {
    if (!result.ok) {
      if (result.code === "STALE_VERSION") {
        onStaleVersion(result.message);
      } else {
        onError(result.message);
      }
      return;
    }
    onSuccess();
  }

  function handleDragStart(event: DragStartEvent) {
    const parsed = parseDndId(String(event.active.id));
    if (!parsed) return;

    dragOriginRef.current = categories;

    if (parsed.kind === "category") {
      const cat = categories.find((c) => c.id === parsed.id);
      setActiveDragKind("category");
      setActiveDragLabel(cat?.name ?? null);
      setActiveDragCategoryId(null);
      return;
    }

    const cat = findCategoryByServiceId(categories, parsed.id);
    const svc = cat?.services.find((s) => s.id === parsed.id);
    if (cat && svc) {
      setActiveDragKind("service");
      setActiveDragLabel(svc.name);
      setActiveDragCategoryId(cat.id);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (isFiltering || !event.over) return;

    const activeParsed = parseDndId(String(event.active.id));
    const overParsed = parseDndId(String(event.over.id));
    if (!activeParsed || !overParsed || activeParsed.kind !== "service") return;

    const current = previewCategories ?? categories;
    const activeCat = findCategoryByServiceId(current, activeParsed.id);
    const target = resolveOverServiceTarget(current, overParsed);
    if (!activeCat || !target || activeCat.id === target.targetCategoryId) {
      return;
    }

    setPreviewCategories(
      applyOptimisticServiceMove(
        current,
        activeParsed.id,
        target.targetCategoryId,
        target.targetSortOrder,
      ),
    );
    setActiveDragCategoryId(target.targetCategoryId);
  }

  function commitCategoryDrop(
    draggedId: string,
    overParsed: NonNullable<ReturnType<typeof parseDndId>>,
    originCategories: CategoryDto[],
  ) {
    const resolved = resolveCategoryDropTarget(
      originCategories,
      draggedId,
      overParsed,
    );
    if (!resolved) return;

    onError(null);
    startTransition(async () => {
      addOptimistic({
        type: "move-category",
        categoryId: resolved.draggedCategory.id,
        targetSortOrder: resolved.targetSortOrder,
      });
      const result = await moveCategoryAction({
        id: resolved.draggedCategory.id,
        version: resolved.draggedCategory.version,
        sort_order: resolved.targetSortOrder,
      });
      handleActionResult(result);
    });
  }

  function commitServiceDrop(
    draggedId: string,
    overParsed: NonNullable<ReturnType<typeof parseDndId>>,
    originCategories: CategoryDto[],
    currentCategories: CategoryDto[],
  ) {
    const originalService = findServiceById(originCategories, draggedId);
    const currentService = findServiceById(currentCategories, draggedId);
    if (!originalService || !currentService) return;

    const target = resolveServiceDropTarget(
      currentCategories,
      currentService,
      overParsed,
    );
    if (!target) return;

    const { targetCategoryId, targetSortOrder } = target;
    if (
      targetCategoryId === originalService.category_id &&
      targetSortOrder === originalService.sort_order
    ) {
      return;
    }

    onError(null);
    startTransition(async () => {
      addOptimistic({
        type: "move-service",
        serviceId: originalService.id,
        targetCategoryId,
        targetSortOrder,
      });
      const result = await moveServiceAction({
        id: originalService.id,
        version: originalService.version,
        category_id: targetCategoryId,
        sort_order: targetSortOrder,
      });
      handleActionResult(result);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const originCategories = dragOriginRef.current ?? categories;
    const currentCategories = previewCategories ?? categories;
    resetDragState();

    if (isFiltering || !event.over) return;

    const activeParsed = parseDndId(String(event.active.id));
    const overParsed = parseDndId(String(event.over.id));
    if (!activeParsed || !overParsed) return;

    if (activeParsed.kind === "category") {
      if (event.active.id !== event.over.id) {
        commitCategoryDrop(activeParsed.id, overParsed, originCategories);
      }
      return;
    }

    commitServiceDrop(
      activeParsed.id,
      overParsed,
      originCategories,
      currentCategories,
    );
  }

  return {
    sensors,
    collisionDetection: catalogCollisionDetection,
    displayCategories: previewCategories ?? categories,
    activeDragLabel,
    activeDragKind,
    activeDragCategoryId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: resetDragState,
  };
}
