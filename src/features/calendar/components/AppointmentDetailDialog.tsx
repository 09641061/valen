"use client";

import { CalendarIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAppointmentAction, updateAppointmentAction } from "../actions";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatChannelLabel,
  resolveCustomerName,
  resolvePersonName,
  resolveServiceName,
} from "../calendar-ui-helpers";
import {
  formatAppointmentTime,
  formatDateHeader,
  getAppointmentLocalDateKey,
} from "../date-utils";
import type {
  AppointmentDto,
  AppointmentStatus,
  CalendarCustomerOption,
  CalendarPersonDto,
  CalendarServiceOption,
} from "../schemas";

interface AppointmentDetailDialogProps {
  appointment: AppointmentDto | null;
  timezone: string;
  people: CalendarPersonDto[];
  customers: CalendarCustomerOption[];
  services: CalendarServiceOption[];
  onClose: () => void;
  onEdit: (appointment: AppointmentDto) => void;
  onUpdated: (appointment: AppointmentDto) => void;
  onDeleted: (id: string) => void;
}

const STATUS_ACTIONS: Array<{ status: AppointmentStatus; label: string }> = [
  { status: "confirmed", label: "Confirm" },
  { status: "completed", label: "Complete" },
  { status: "no_show", label: "No show" },
  { status: "cancelled", label: "Cancel" },
];

const TERMINAL_STATUSES = new Set<AppointmentStatus>([
  "completed",
  "cancelled",
  "no_show",
]);

export function AppointmentDetailDialog({
  appointment,
  timezone,
  people,
  customers,
  services,
  onClose,
  onEdit,
  onUpdated,
  onDeleted,
}: AppointmentDetailDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!appointment) return null;

  const customerName = resolveCustomerName(appointment, customers);
  const serviceName = resolveServiceName(appointment, services);
  const personName = resolvePersonName(appointment, people);
  const localDate = getAppointmentLocalDateKey(appointment.starts_at, timezone);
  const timeRange = `${formatAppointmentTime(appointment.starts_at, timezone)} – ${formatAppointmentTime(appointment.ends_at, timezone)}`;
  const notes = appointment.notes.trim();
  const availableTransitions = TERMINAL_STATUSES.has(appointment.status)
    ? []
    : STATUS_ACTIONS.filter((action) => action.status !== appointment.status);

  function formatMutationError(code: string, message: string) {
    return code === "STALE_VERSION"
      ? "This appointment was updated elsewhere. Refresh and try again."
      : message;
  }

  function handleStatusChange(nextStatus: AppointmentStatus) {
    if (!appointment) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateAppointmentAction({
        id: appointment.id,
        version: appointment.version,
        status: nextStatus,
      });
      if (!result.ok) {
        setErrorMessage(formatMutationError(result.code, result.message));
        return;
      }
      onUpdated(result.data);
    });
  }

  function handleDelete() {
    if (!appointment) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteAppointmentAction({
        id: appointment.id,
        version: appointment.version,
      });
      if (!result.ok) {
        setConfirmDeleteOpen(false);
        setErrorMessage(formatMutationError(result.code, result.message));
        return;
      }
      setConfirmDeleteOpen(false);
      onDeleted(appointment.id);
    });
  }

  return (
    <>
      <Dialog open={Boolean(appointment)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-7">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="truncate text-base font-semibold">
                {serviceName} · {customerName}
              </DialogTitle>
              <Badge variant="outline" className={`shrink-0 ${STATUS_BADGE_CLASSES[appointment.status]}`}>
                {STATUS_LABELS[appointment.status]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatDateHeader(localDate, timezone)}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{timeRange}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="mt-0.5 truncate font-medium">{customerName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="mt-0.5 truncate font-medium">{serviceName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Assigned to</p>
                <p className="mt-0.5 truncate font-medium">{personName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Channel</p>
                <p className="mt-0.5 truncate font-medium">{formatChannelLabel(appointment.channel)}</p>
              </div>
            </div>

            {notes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-2.5 text-sm">
                  {notes}
                </p>
              </div>
            )}

            {availableTransitions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t pt-3">
                {availableTransitions.map((action) => (
                  <Button
                    key={action.status}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleStatusChange(action.status)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {errorMessage && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </p>
            )}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2Icon className="size-4" />
              Delete
            </Button>
            <Button type="button" size="sm" disabled={isPending} onClick={() => onEdit(appointment)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The appointment for {customerName} will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>{isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
