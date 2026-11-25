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
  isUpdatingAi: boolean;
  onOpenProfile: () => void;
  onToggleStatus: () => void;
  onResumeAi: () => void;
}

function ConversationHeaderMeta({
  conversation,
  customer,
  isClosed,
}: {
  conversation: ConversationDto;
  customer: CustomerDto | null;
  isClosed: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {getInitials(customer?.name ?? "?")}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold">
            {customer?.name ?? "Unknown customer"}
          </h2>
          <Badge
            variant={isClosed ? "secondary" : "default"}
            className="capitalize"
          >
            {conversation.status}
          </Badge>
          {conversation.ai_paused ? (
            <Badge
              variant="outline"
              title={conversation.handoff_reason || undefined}
            >
              AI paused
            </Badge>
          ) : null}
        </div>
        {customer?.phone ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" />
            {customer.phone}
          </p>
        ) : null}
        {conversation.ai_paused && conversation.handoff_reason ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Handoff reason: {conversation.handoff_reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ConversationThreadHeader({
  conversation,
  customer,
  isUpdatingStatus,
  isUpdatingAi,
  onOpenProfile,
  onToggleStatus,
  onResumeAi,
}: ConversationThreadHeaderProps) {
  const isClosed = conversation.status === "closed";
  const canResumeAi = !isClosed && conversation.ai_paused;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
      <ConversationHeaderMeta
        conversation={conversation}
        customer={customer}
        isClosed={isClosed}
      />

      <div className="flex items-center gap-2">
        {canResumeAi ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUpdatingAi}
            onClick={onResumeAi}
          >
            Resume AI
          </Button>
        ) : null}
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
