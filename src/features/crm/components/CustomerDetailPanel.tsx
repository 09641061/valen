"use client";

import { Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInitials } from "../format";
import type { CustomerDto } from "../schemas";

interface CustomerDetailPanelProps {
  customer: CustomerDto | null;
  onViewProfile: (customer: CustomerDto) => void;
  onEdit: (customer: CustomerDto) => void;
  onDelete: (customer: CustomerDto) => void;
}

export function CustomerDetailPanel({
  customer,
  onViewProfile,
  onEdit,
  onDelete,
}: CustomerDetailPanelProps) {
  if (!customer) {
    return (
      <Card className="h-fit">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <UserRound className="mb-3 size-8 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            Select a customer
          </p>
          <p className="mt-1 text-xs">
            Choose a customer from the list to inspect details or open their
            profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
          {getInitials(customer.name)}
        </div>
        <div className="min-w-0">
          <CardTitle className="truncate text-lg">{customer.name}</CardTitle>
          <CardDescription className="mt-0.5 flex items-center gap-1.5">
            <Phone className="size-3.5" />
            <span>{customer.phone}</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onViewProfile(customer)}
        >
          View profile
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(customer)}
        >
          <Pencil className="mr-1.5 size-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(customer)}
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Delete
        </Button>
      </CardContent>
    </Card>
  );
}
