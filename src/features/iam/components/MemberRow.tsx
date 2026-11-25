"use client";

import { Crown, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  canRemoveMember,
  getFullName,
  getInitials,
} from "../permissions";
import type { ActorDto } from "../schemas";

export function MemberRow({
  actor,
  member,
  onRemove,
}: {
  actor: ActorDto;
  member: ActorDto;
  onRemove: (member: ActorDto) => void;
}) {
  const allowRemove = canRemoveMember(actor, member);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 md:grid-cols-[1.4fr_1fr_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {getInitials(member.first_name, member.last_name, member.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {getFullName(member)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {member.email}
          </p>
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-1.5 md:flex">
        {member.type === "owner" ? (
          <Badge className="gap-1 bg-accent text-accent-foreground">
            <Crown aria-hidden="true" className="size-3" />
            Owner
          </Badge>
        ) : (
          <Badge variant="outline">Member</Badge>
        )}
      </div>

      <div className="flex justify-end">
        {allowRemove ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${getFullName(member)}`}
                />
              }
            >
              <MoreHorizontal aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(member)}
              >
                <Trash2 aria-hidden="true" className="mr-2 size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="w-9" />
        )}
      </div>
    </div>
  );
}
