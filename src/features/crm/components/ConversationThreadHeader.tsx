"use client";

import { Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "../format";
import type { ConversationDto, CustomerDto } from "../schemas";

interface ConversationThreadHeaderProps {
  conversation: ConversationDto;
  customer: CustomerDto | null;
  isUpdatingStatus: boolean;
  onOpenProfile: () => void;
  onToggleStatus: () => void;
}

export function ConversationThreadHeader({
  conversation,
  customer,
  isUpdatingStatus,
  onOpenProfile,
  onToggleStatus,
}: ConversationThreadHeaderProps) {
  const isClosed = conversation.status === "closed";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(customer?.name ?? "?")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">
              {customer?.name ?? "Unknown customer"}
            </h2>
            <Badge
              variant={isClosed ? "secondary" : "default"}
              className="capitalize"
            >
              {conversation.status}
            </Badge>
          </div>
          {customer?.phone ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              {customer.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {customer ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenProfile}
            className="gap-1.5"
          >
            <User className="size-3.5" />
            View profile
          </Button>
        ) : null}
        <Button
          type="button"
          variant={isClosed ? "default" : "outline"}
          size="sm"
          disabled={isUpdatingStatus}
          onClick={onToggleStatus}
        >
          {isClosed ? "Reopen conversation" : "Close conversation"}
        </Button>
      </div>
    </header>
  );
}
