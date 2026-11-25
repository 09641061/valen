"use client";

import { MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getInitials } from "../format";
import type { CustomerDto } from "../schemas";

interface CustomersTableProps {
  customers: CustomerDto[];
  selectedCustomerId: string | null;
  searchQuery: string;
  page: number;
  pageSize: number;
  total: number;
  onSearchSubmit: (query: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: CustomerDto) => void;
  onViewProfile: (customer: CustomerDto) => void;
  onEditCustomer: (customer: CustomerDto) => void;
  onDeleteCustomer: (customer: CustomerDto) => void;
}

export function CustomersTable({
  customers,
  selectedCustomerId,
  searchQuery,
  page,
  pageSize,
  total,
  onSearchSubmit,
  onPageChange,
  onSelectCustomer,
  onViewProfile,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersTableProps) {
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchSubmit(draftQuery.trim());
  }

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-b p-3"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search by name or phone"
            aria-label="Search by name or phone"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Customer &amp; phone</th>
              <th className="w-20 px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const isSelected = customer.id === selectedCustomerId;
                return (
                  <tr
                    key={customer.id}
                    data-selected={isSelected ? "true" : "false"}
                    className={`transition-colors hover:bg-muted/40 ${
                      isSelected ? "bg-muted/70" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelectCustomer(customer)}
                        className="flex w-full items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {customer.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
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
                          <DropdownMenuItem
                            onClick={() => onViewProfile(customer)}
                          >
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditCustomer(customer)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDeleteCustomer(customer)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
