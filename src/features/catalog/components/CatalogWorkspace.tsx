"use client";

import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
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
}

export function CatalogWorkspace({ initialCategories }: CatalogWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [staleMessage, setStaleMessage] = useState<string | null>(null);
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

  const visibleCategories = useMemo(() => {
    if (!normalizedQuery) return optimisticCategories;

    return optimisticCategories
      .map((category) => {
        if (category.name.toLowerCase().includes(normalizedQuery)) {
          return category;
        }
        const matchingServices = category.services.filter(
          (service) =>
            service.name.toLowerCase().includes(normalizedQuery) ||
            service.description.toLowerCase().includes(normalizedQuery),
        );
        return matchingServices.length > 0
          ? { ...category, services: matchingServices }
          : null;
      })
      .filter((category): category is CategoryDto => category !== null);
  }, [optimisticCategories, normalizedQuery]);

  function handleMutationSuccess() {
    setStaleMessage(null);
    setErrorMessage(null);
    router.refresh();
  }

  const dnd = useCatalogDnd({
    categories: optimisticCategories,
    isFiltering,
    addOptimistic,
    onStaleVersion: setStaleMessage,
    onError: setErrorMessage,
    onSuccess: handleMutationSuccess,
  });

  const categoryDndIds = visibleCategories.map((c) => toCategoryDndId(c.id));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <CatalogHeader
        searchQuery={searchQuery}
        isFiltering={isFiltering}
        staleMessage={staleMessage}
        errorMessage={errorMessage}
        onSearchChange={setSearchQuery}
        onNewCategory={() => {
          setEditingCategory(null);
          setCategoryDialogOpen(true);
        }}
        onReloadCatalog={handleMutationSuccess}
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
          collisionDetection={closestCorners}
          onDragStart={dnd.handleDragStart}
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
                  isFiltering={isFiltering}
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
        onStaleVersion={setStaleMessage}
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
        onStaleVersion={setStaleMessage}
        onSuccess={handleMutationSuccess}
      />

      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onStaleVersion={setStaleMessage}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
