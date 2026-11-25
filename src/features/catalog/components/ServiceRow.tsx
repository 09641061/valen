"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDuration, formatPrice } from "../format";
import type { ServiceDto } from "../schemas";
import { toServiceDndId } from "./dnd-ids";

interface ServiceRowProps {
  service: ServiceDto;
  currencyCode?: string;
  isFiltering: boolean;
  onEdit: (service: ServiceDto) => void;
  onDelete: (service: ServiceDto) => void;
}

export function ServiceRow({
  service,
  currencyCode = "USD",
  isFiltering,
  onEdit,
  onDelete,
}: ServiceRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: toServiceDndId(service.id),
    data: { type: "service", service },
    disabled: isFiltering,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`service-row-${service.id}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/40",
        isDragging && "z-10 opacity-60 shadow-md ring-2 ring-primary/30",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Reorder service ${service.name}`}
          disabled={isFiltering}
          className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {service.name}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Badge variant="secondary" className="gap-1 font-normal">
          <Clock className="size-3" aria-hidden="true" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </Badge>

        <span className="min-w-20 text-right text-sm font-semibold tabular-nums text-foreground">
          {formatPrice(service.price_minor_units, currencyCode)}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${service.name}`}
              />
            }
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(service)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
