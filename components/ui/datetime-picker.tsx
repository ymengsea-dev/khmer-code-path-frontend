"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassBtnPrimaryClass, glassBtnSubtleClass } from "@/components/ui/glass-field";
import { TimePicker } from "@/components/ui/time-picker";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse a datetime-local string ("YYYY-MM-DDTHH:mm") into parts. */
function parseValue(value: string): { y: number; m: number; d: number; time: string } {
  const now = new Date();
  const fallback = {
    y: now.getFullYear(),
    m: now.getMonth(),
    d: now.getDate(),
    time: "23:59",
  };
  if (!value) return fallback;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = (datePart ?? "").split("-").map(Number);
  if (!y || !m || !d) return fallback;
  return { y, m: m - 1, d, time: timePart?.slice(0, 5) || "23:59" };
}

function toValue(y: number, m: number, d: number, time: string): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}T${time}`;
}

function formatLabel(value: string): string {
  if (!value) return "";
  const { y, m, d, time } = parseValue(value);
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${MONTHS[m].slice(0, 3)} ${d}, ${y} · ${h12}:${pad2(min)} ${period}`;
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  disabled,
  placeholder = "Pick a date & time",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() => parseValue(value));

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(parseValue(value));
    setOpen(next);
  };

  const handleOk = () => {
    onChange(toValue(draft.y, draft.m, draft.d, draft.time));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const goMonth = (delta: number) => {
    setDraft((prev) => {
      const next = new Date(prev.y, prev.m + delta, 1);
      const y = next.getFullYear();
      const m = next.getMonth();
      const maxDay = new Date(y, m + 1, 0).getDate();
      return { ...prev, y, m, d: Math.min(prev.d, maxDay) };
    });
  };

  const firstWeekday = new Date(draft.y, draft.m, 1).getDay();
  const daysInMonth = new Date(draft.y, draft.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-sm text-left outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? formatLabel(value) : placeholder}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          className="isolate z-50 outline-none"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
        >
          <PopoverPrimitive.Popup className="z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-black/10 dark:shadow-black/45 outline-none transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0">
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-foreground">
                {MONTHS[draft.m]} {draft.y}
              </span>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 px-3 pb-1">
              {WEEKDAYS.map((w, i) => (
                <span
                  key={i}
                  className="text-center text-[10px] font-bold uppercase text-muted-foreground/70"
                >
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 px-3 pb-2">
              {cells.map((day, i) =>
                day === null ? (
                  <span key={`e${i}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, d: day }))}
                    className={cn(
                      "h-8 w-full rounded-lg text-xs font-medium transition-colors",
                      draft.d === day
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground hover:bg-black/5 dark:hover:bg-white/10",
                    )}
                  >
                    {day}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-zinc-800 px-3 py-2.5">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Time</span>
              <div className="ml-auto w-32">
                <TimePicker
                  value={draft.time}
                  onChange={(t) => setDraft((prev) => ({ ...prev, time: t }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-zinc-800 p-2">
              {value ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mr-auto h-8 px-2 text-xs font-semibold text-rose-500 hover:text-rose-600"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(glassBtnSubtleClass, "ml-auto h-8 px-3 text-xs")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOk}
                className={cn(glassBtnPrimaryClass, "h-8 px-3 text-xs")}
              >
                OK
              </button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
