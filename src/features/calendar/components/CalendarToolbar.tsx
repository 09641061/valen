"use client";

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { isValidDateKey } from "../date-utils";
import type { CalendarPersonDto, CalendarViewMode } from "../schemas";
import { DatePickerField } from "./DatePickerField";

interface CalendarToolbarProps {
  view: CalendarViewMode;
  dateKey: string;
  todayKey: string;
  periodLabel: string;
  people: CalendarPersonDto[];
  selectedPersonIds: string[];
  onStepPeriod: (direction: -1 | 1) => void;
  onJumpToDate: (dateKey: string) => void;
  onChangeView: (view: CalendarViewMode) => void;
  onTogglePerson: (personId: string) => void;
  onClearPeople: () => void;
}

const VIEW_OPTIONS: Array<{ value: CalendarViewMode; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function CalendarToolbar({
  view,
  dateKey,
  todayKey,
  periodLabel,
  people,
  selectedPersonIds,
  onStepPeriod,
  onJumpToDate,
  onChangeView,
  onTogglePerson,
  onClearPeople,
}: CalendarToolbarProps) {
  const [peopleQuery, setPeopleQuery] = useState("");
  const normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
  const filteredPeople = useMemo(
    () =>
      normalizedPeopleQuery
        ? people.filter((p) => p.name.toLowerCase().includes(normalizedPeopleQuery))
        : people,
    [people, normalizedPeopleQuery],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous period"
            onClick={() => onStepPeriod(-1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next period"
            onClick={() => onStepPeriod(1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <span className="min-w-[140px] text-sm font-semibold">{periodLabel}</span>

        <DatePickerField
          aria-label="Jump to date"
          value={dateKey}
          onChange={(next) => {
            if (isValidDateKey(next)) onJumpToDate(next);
          }}
          className="w-36"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onJumpToDate(todayKey)}
        >
          Today
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Calendar view"
          className="inline-flex rounded-lg border bg-muted/40 p-0.5"
        >
          {VIEW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={view === opt.value ? "secondary" : "ghost"}
              aria-pressed={view === opt.value}
              onClick={() => onChangeView(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <Popover onOpenChange={(open) => { if (!open) setPeopleQuery(""); }}>
          <PopoverTrigger
            render={
              <Button type="button" variant="outline" size="sm">
                <UsersIcon className="size-4" />
                People
                {selectedPersonIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedPersonIds.length}
                  </Badge>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-64 p-2">
            {people.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No active team members found.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Input
                  value={peopleQuery}
                  onChange={(e) => setPeopleQuery(e.target.value)}
                  placeholder="Search people..."
                  aria-label="Search people"
                  autoFocus
                />
                <div className="max-h-60 space-y-1 overflow-y-auto">
                  {!normalizedPeopleQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClearPeople}
                      className={cn(
                        "w-full justify-between font-normal",
                        selectedPersonIds.length === 0 &&
                          "bg-accent font-medium text-accent-foreground",
                      )}
                    >
                      <span>All people</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {people.length}
                      </span>
                    </Button>
                  )}
                  {filteredPeople.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No matching people.
                    </p>
                  ) : (
                    filteredPeople.map((person) => {
                      const active = selectedPersonIds.includes(person.id);
                      return (
                        <Button
                          key={person.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onTogglePerson(person.id)}
                          className={cn(
                            "w-full justify-between font-normal",
                            active && "bg-accent font-medium text-accent-foreground",
                          )}
                        >
                          <span className="truncate">{person.name}</span>
                          {active && <CheckIcon className="size-4 shrink-0" />}
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
