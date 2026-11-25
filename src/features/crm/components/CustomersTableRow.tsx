"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "../format";
import type { CustomerDto } from "../schemas";

interface CustomersTableRowProps {
  customer: CustomerDto;
  isSelected: boolean;
  onSelect: (customer: CustomerDto) => void;
  onViewProfile: (customer: CustomerDto) => void;
  onEdit: (customer: CustomerDto) => void;
  onDelete: (customer: CustomerDto) => void;
}

export function CustomersTableRow({
  customer,
  isSelected,
  onSelect,
  onViewProfile,
  onEdit,
  onDelete,
}: CustomersTableRowProps) {
  return (
    <tr
      data-selected={isSelected ? "true" : "false"}
      className={`transition-colors hover:bg-muted/40 ${
        isSelected ? "bg-muted/70" : ""
      }`}
    >
      <td className="px-4 py-3">
        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(customer)}
          className="flex w-full items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {customer.name}
            </p>
            <p className="truncate text-xs tabular-nums text-muted-foreground">
              {customer.phone}
            </p>
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${customer.name}`}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewProfile(customer)}>
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(customer)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
