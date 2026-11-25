"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState } from "react";
import {
  applyOptimisticCategoryMove,
  applyOptimisticServiceMove,
} from "../format";
import type { CategoryDto, ServiceDto } from "../schemas";
import { CatalogEmptyState } from "./CatalogEmptyState";
import { CatalogHeader } from "./CatalogHeader";
import { CategoryCard } from "./CategoryCard";
import { CategoryDialog } from "./CategoryDialog";
import { DeleteConfirmDialog, type DeleteTarget } from "./DeleteConfirmDialog";
import { toCategoryDndId } from "./dnd-ids";
import { ServiceDialog } from "./ServiceDialog";
import { type CatalogOptimisticAction, useCatalogDnd } from "./useCatalogDnd";

interface CatalogWorkspaceProps {
  initialCategories: CategoryDto[];
  currencyCode?: string;
}

export function CatalogWorkspace({
  initialCategories,
  currencyCode = "USD",
}: CatalogWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null,
  );
  const [serviceDialogState, setServiceDialogState] = useState<{
    open: boolean;
    categoryId: string;
    service: ServiceDto | null;
  }>({ open: false, categoryId: "", service: null });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [optimisticCategories, addOptimistic] = useOptimistic(
    initialCategories,
    (state: CategoryDto[], action: CatalogOptimisticAction) =>
      action.type === "move-category"
        ? applyOptimisticCategoryMove(
            state,
            action.categoryId,
            action.targetSortOrder,
          )
        : applyOptimisticServiceMove(
            state,
            action.serviceId,
            action.targetCategoryId,
            action.targetSortOrder,
          ),
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;

  function handleMutationSuccess() {
    setErrorMessage(null);
    router.refresh();
  }

  const dnd = useCatalogDnd({
    categories: optimisticCategories,
    isFiltering,
    addOptimistic,
    onError: setErrorMessage,
    onSuccess: handleMutationSuccess,
  });

  const visibleCategories = useMemo(() => {
    const source = dnd.displayCategories;
    if (!normalizedQuery) return source;

    return source
      .map((category) => {
        if (category.name.toLowerCase().includes(normalizedQuery)) {
          return category;
        }
        const matchingServices = category.services.filter(
          (service) =>
            service.name.toLowerCase().includes(normalizedQuery),
        );
        return matchingServices.length > 0
          ? { ...category, services: matchingServices }
          : null;
      })
      .filter((category): category is CategoryDto => category !== null);
  }, [dnd.displayCategories, normalizedQuery]);

  const categoryDndIds = visibleCategories.map((c) => toCategoryDndId(c.id));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <CatalogHeader
        searchQuery={searchQuery}
        isFiltering={isFiltering}
        errorMessage={errorMessage}
        onSearchChange={setSearchQuery}
        onNewCategory={() => {
          setEditingCategory(null);
          setCategoryDialogOpen(true);
        }}
        onDismissError={() => setErrorMessage(null)}
      />

      {optimisticCategories.length === 0 ? (
        <CatalogEmptyState
          variant="empty-catalog"
          onAction={() => {
            setEditingCategory(null);
            setCategoryDialogOpen(true);
          }}
        />
      ) : visibleCategories.length === 0 ? (
        <CatalogEmptyState
          variant="empty-search"
          searchQuery={searchQuery}
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <DndContext
          id="catalog-dnd-context"
          sensors={dnd.sensors}
          collisionDetection={dnd.collisionDetection}
          onDragStart={dnd.handleDragStart}
          onDragOver={dnd.handleDragOver}
          onDragEnd={dnd.handleDragEnd}
          onDragCancel={dnd.handleDragCancel}
        >
          <SortableContext
            items={categoryDndIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {visibleCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  currencyCode={currencyCode}
                  isFiltering={isFiltering}
                  isDraggingService={dnd.activeDragKind === "service"}
                  isServiceDropTarget={
                    dnd.activeDragKind === "service" &&
                    dnd.activeDragCategoryId === category.id
                  }
                  onAddService={(categoryId) =>
                    setServiceDialogState({
                      open: true,
                      categoryId,
                      service: null,
                    })
                  }
                  onEditCategory={(cat) => {
                    setEditingCategory(cat);
                    setCategoryDialogOpen(true);
                  }}
                  onDeleteCategory={(cat) =>
                    setDeleteTarget({ kind: "category", category: cat })
                  }
                  onEditService={(service) =>
                    setServiceDialogState({
                      open: true,
                      categoryId: service.category_id,
                      service,
                    })
                  }
                  onDeleteService={(service) =>
                    setDeleteTarget({ kind: "service", service })
                  }
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {dnd.activeDragLabel ? (
              <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-lg">
                {dnd.activeDragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CategoryDialog
        key={
          categoryDialogOpen
            ? (editingCategory?.id ?? "new-category")
            : "closed-category"
        }
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSuccess={handleMutationSuccess}
      />

      <ServiceDialog
        key={
          serviceDialogState.open
            ? (serviceDialogState.service?.id ??
              `new-${serviceDialogState.categoryId}`)
            : "closed-service"
        }
        open={serviceDialogState.open}
        onOpenChange={(open) =>
          setServiceDialogState((prev) => ({ ...prev, open }))
        }
        categoryId={serviceDialogState.categoryId}
        service={serviceDialogState.service}
        currencyCode={currencyCode}
        onSuccess={handleMutationSuccess}
      />

      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
