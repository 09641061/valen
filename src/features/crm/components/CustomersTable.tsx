"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import type { CustomerDto } from "../schemas";
import { CustomersTableRow } from "./CustomersTableRow";

const SEARCH_DEBOUNCE_MS = 300;

function resolveSearchSync(params: {
  searchQuery: string;
  previousUrlQuery: string;
  isSearching: boolean;
  pendingQuery: string | null;
  draftQuery: string;
}): { clearPending: boolean; nextDraftQuery?: string } {
  const {
    searchQuery,
    previousUrlQuery,
    isSearching,
    pendingQuery,
    draftQuery,
  } = params;
  if (pendingQuery !== null) {
    const settled =
      searchQuery === pendingQuery &&
      (!isSearching || searchQuery !== previousUrlQuery);
    return { clearPending: settled };
  }
  if (
    searchQuery !== previousUrlQuery &&
    draftQuery.trim() === previousUrlQuery
  ) {
    return { clearPending: false, nextDraftQuery: searchQuery };
  }
  return { clearPending: false };
}

interface CustomersTableProps {
  customers: CustomerDto[];
  selectedCustomerId: string | null;
  searchQuery: string;
  page: number;
  pageSize: number;
  total: number;
  isSearching?: boolean;
  onSearchChange: (query: string) => void;
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
  isSearching = false,
  onSearchChange,
  onPageChange,
  onSelectCustomer,
  onViewProfile,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersTableProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevIsSearching, setPrevIsSearching] = useState(isSearching);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  if (searchQuery !== prevSearchQuery || isSearching !== prevIsSearching) {
    const previousUrlQuery = prevSearchQuery;
    setPrevSearchQuery(searchQuery);
    setPrevIsSearching(isSearching);
    const sync = resolveSearchSync({
      searchQuery,
      previousUrlQuery,
      isSearching,
      pendingQuery,
      draftQuery,
    });
    if (sync.clearPending) setPendingQuery(null);
    if (sync.nextDraftQuery !== undefined) setDraftQuery(sync.nextDraftQuery);
  }

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPendingDebounce() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  const formCleanupRef = useCallback(
    (_node: HTMLFormElement | null) => () => clearPendingDebounce(),
    [],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canClean = draftQuery.length > 0 || searchQuery.length > 0;

  function emitSearch(query: string) {
    setPendingQuery(query === searchQuery && !isSearching ? null : query);
    onSearchChange(query);
  }

  function handleSearchInputChange(nextValue: string) {
    setDraftQuery(nextValue);
    clearPendingDebounce();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      emitSearch(nextValue.trim());
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPendingDebounce();
    emitSearch(draftQuery.trim());
  }

  function handleClean() {
    clearPendingDebounce();
    setDraftQuery("");
    emitSearch("");
    searchInputRef.current?.focus();
  }

  function handlePageChange(nextPage: number) {
    clearPendingDebounce();
    onPageChange(nextPage);
  }

  return (
    <div
      className="flex flex-col rounded-xl border bg-card"
      aria-busy={isSearching}
    >
      <form
        ref={formCleanupRef}
        role="search"
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-b p-3"
      >
        <SearchInput
          inputRef={searchInputRef}
          value={draftQuery}
          onChange={handleSearchInputChange}
          placeholder="Search by name or phone"
          ariaLabel="Search by name or phone"
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="default"
          disabled={!canClean}
          onClick={handleClean}
        >
          Clear
        </Button>
      </form>

      <p className="sr-only" aria-live="polite">
        {`${total} customer${total === 1 ? "" : "s"} found`}
      </p>

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
              customers.map((customer) => (
                <CustomersTableRow
                  key={customer.id}
                  customer={customer}
                  isSelected={customer.id === selectedCustomerId}
                  onSelect={onSelectCustomer}
                  onViewProfile={onViewProfile}
                  onEdit={onEditCustomer}
                  onDelete={onDeleteCustomer}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
