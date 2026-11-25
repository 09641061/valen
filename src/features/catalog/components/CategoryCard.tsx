"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CategoryDto, ServiceDto } from "../schemas";
import {
  toCategoryDndId,
  toCategoryDropId,
  toServiceDndId,
} from "./dnd-ids";
import { ServiceRow } from "./ServiceRow";

interface CategoryCardProps {
  category: CategoryDto;
  currencyCode?: string;
  isFiltering: boolean;
  isDraggingService?: boolean;
  isServiceDropTarget?: boolean;
  onAddService: (categoryId: string) => void;
  onEditCategory: (category: CategoryDto) => void;
  onDeleteCategory: (category: CategoryDto) => void;
  onEditService: (service: ServiceDto) => void;
  onDeleteService: (service: ServiceDto) => void;
}

export function CategoryCard({
  category,
  currencyCode = "USD",
  isFiltering,
  isDraggingService = false,
  isServiceDropTarget = false,
  onAddService,
  onEditCategory,
  onDeleteCategory,
  onEditService,
  onDeleteService,
}: CategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: toCategoryDndId(category.id),
    data: { type: "category", category },
    disabled: isFiltering,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: toCategoryDropId(category.id),
    data: { type: "category-drop", categoryId: category.id },
    disabled: isFiltering,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const serviceIds = category.services.map((s) => toServiceDndId(s.id));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-testid={`category-card-${category.id}`}
      className={cn(
        "gap-0 py-0 transition-shadow",
        isDragging && "z-10 opacity-60 shadow-lg ring-2 ring-primary/30",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Reorder category ${category.name}`}
            disabled={isFiltering}
            className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </Button>

          <CardTitle className="truncate text-base font-semibold">
            {category.name}
          </CardTitle>

          <Badge variant="outline" className="shrink-0 tabular-nums">
            {category.services.length}{" "}
            {category.services.length === 1 ? "service" : "services"}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddService(category.id)}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Add service</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for category ${category.name}`}
                />
              }
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditCategory(category)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteCategory(category)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <Separator />

      <CardContent
        ref={setDropRef}
        className={cn(
          "space-y-2 p-4 transition-colors",
          (isServiceDropTarget || (isDraggingService && isOver)) &&
            "bg-primary/5",
        )}
      >
        <SortableContext
          items={serviceIds}
          strategy={verticalListSortingStrategy}
        >
          {category.services.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No services in this category. Add one or drag a service here.
            </div>
          ) : (
            category.services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                currencyCode={currencyCode}
                isFiltering={isFiltering}
                onEdit={onEditService}
                onDelete={onDeleteService}
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}
