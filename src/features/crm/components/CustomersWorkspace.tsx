"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteCustomerAction,
  loadConversationMessagesAction,
  loadCustomerConversationsAction,
} from "../actions";
import type {
  ConversationDto,
  CustomerDto,
  CustomerPageDto,
  MessageDto,
} from "../schemas";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { CustomerProfileDialog } from "./CustomerProfileDialog";
import { CustomersTable } from "./CustomersTable";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";

interface CustomersWorkspaceProps {
  customerPage: CustomerPageDto;
  initialQuery: string;
  initialSelectedCustomer: CustomerDto | null;
}

interface ProfileState {
  customer: CustomerDto;
  conversations: ConversationDto[];
  initialMessages: MessageDto[];
  initialConversationId: string | null;
  error: string | null;
}

function buildCustomersUrl(
  baseQuery: string,
  basePage: number,
  next: { q?: string; page?: number; customerId?: string },
): string {
  const params = new URLSearchParams();
  const q = next.q !== undefined ? next.q : baseQuery;
  const page = next.page !== undefined ? next.page : basePage;
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  if (next.customerId) params.set("customerId", next.customerId);
  const qs = params.toString();
  return qs ? `/customers?${qs}` : "/customers";
}

async function fetchProfileData(customer: CustomerDto): Promise<ProfileState> {
  const convResult = await loadCustomerConversationsAction(customer.id);
  if (!convResult.ok) {
    return {
      customer,
      conversations: [],
      initialMessages: [],
      initialConversationId: null,
      error: convResult.message,
    };
  }
  const conversations = convResult.data;
  const first =
    conversations.find((c) => c.status === "open") ?? conversations[0] ?? null;
  let initialMessages: MessageDto[] = [];
  let error: string | null = null;
  if (first) {
    const msgResult = await loadConversationMessagesAction(first.id);
    if (msgResult.ok) initialMessages = msgResult.data;
    else error = msgResult.message;
  }
  return {
    customer,
    conversations,
    initialMessages,
    initialConversationId: first?.id ?? null,
    error,
  };
}

export function CustomersWorkspace({
  customerPage,
  initialQuery,
  initialSelectedCustomer,
}: CustomersWorkspaceProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(
    null,
  );
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerDto | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const profileReqRef = useRef(0);
  const [isLoadingProfile, startProfileTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function updateUrl(next: { q?: string; page?: number; customerId?: string }) {
    router.replace(buildCustomersUrl(initialQuery, customerPage.page, next));
  }

  function handleOpenProfile(customer: CustomerDto) {
    const reqId = ++profileReqRef.current;
    setProfileState({
      customer,
      conversations: [],
      initialMessages: [],
      initialConversationId: null,
      error: null,
    });
    startProfileTransition(async () => {
      const next = await fetchProfileData(customer);
      if (profileReqRef.current === reqId) setProfileState(next);
    });
  }

  function handleEdit(customer: CustomerDto) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  function handleRequestDelete(customer: CustomerDto) {
    setDeleteError(null);
    setDeletingCustomer(customer);
  }

  function handleConfirmDelete() {
    if (!deletingCustomer) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteCustomerAction({ id: deletingCustomer.id });
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setDeletingCustomer(null);
      updateUrl({ customerId: undefined });
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer contacts and view their conversation history.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingCustomer(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 size-4" />
          Add customer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CustomersTable
          key={`${initialQuery}-${customerPage.page}`}
          customers={customerPage.items}
          selectedCustomerId={initialSelectedCustomer?.id ?? null}
          searchQuery={initialQuery}
          page={customerPage.page}
          pageSize={customerPage.page_size}
          total={customerPage.total}
          onSearchSubmit={(q) => updateUrl({ q, page: 1, customerId: undefined })}
          onPageChange={(page) => updateUrl({ page, customerId: undefined })}
          onSelectCustomer={(c) => updateUrl({ customerId: c.id })}
          onViewProfile={handleOpenProfile}
          onEditCustomer={handleEdit}
          onDeleteCustomer={handleRequestDelete}
        />

        <CustomerDetailPanel
          customer={initialSelectedCustomer}
          onViewProfile={handleOpenProfile}
          onEdit={handleEdit}
          onDelete={handleRequestDelete}
        />
      </div>

      <CustomerFormDialog
        key={
          formOpen
            ? editingCustomer
              ? `${editingCustomer.id}-${editingCustomer.version}`
              : "new"
            : "closed"
        }
        open={formOpen}
        customer={editingCustomer}
        onOpenChange={setFormOpen}
        onSaved={(saved) => {
          updateUrl({ customerId: saved.id });
          router.refresh();
        }}
        onOpenExistingProfile={handleOpenProfile}
      />

      {profileState && (
        <CustomerProfileDialog
          key={profileState.customer.id}
          open={true}
          customer={profileState.customer}
          conversations={profileState.conversations}
          initialMessages={profileState.initialMessages}
          initialConversationId={profileState.initialConversationId}
          isLoadingConversations={isLoadingProfile}
          loadError={profileState.error}
          onOpenChange={(open) => {
            if (!open) {
              profileReqRef.current += 1;
              setProfileState(null);
            }
          }}
        />
      )}

      <DeleteCustomerDialog
        customer={deletingCustomer}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => {
          setDeletingCustomer(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
