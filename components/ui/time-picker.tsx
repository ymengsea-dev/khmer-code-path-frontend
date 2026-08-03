"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassBtnPrimaryClass, glassBtnSubtleClass } from "@/components/ui/glass-field";

const ROW_HEIGHT = 32;
const VISIBLE_ROWS = 5;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS = ["AM", "PM"] as const;

function parseTime(value: string): { hour12: number; minute: number; period: "AM" | "PM" } {
  const [h, m] = value.split(":").map(Number);
  const hour = Number.isFinite(h) ? h : 0;
  const minute = Number.isFinite(m) ? m : 0;
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return { hour12, minute, period };
}

function toValue(hour12: number, minute: number, period: "AM" | "PM"): string {
  const hour24 = period === "AM" ? hour12 % 12 : (hour12 % 12) + 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTimeLabel(value: string): string {
  const { hour12, minute, period } = parseTime(value);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function WheelColumn<T extends string | number>({
  items,
  selected,
  onChange,
}: {
  items: T[];
  selected: T;
  onChange: (item: T) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const index = items.indexOf(selected);
    // Set before paint — doing this in a post-paint effect flashes the
    // column at scrollTop 0 for a frame, which reads as a flicker over
    // whatever sits right below the trigger (e.g. the room picker).
    if (index >= 0) el.scrollTop = index * ROW_HEIGHT;
    // Only snap to the selected value on mount (popover open) — not on every
    // selection change, or the wheel would fight the user's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = containerRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / ROW_HEIGHT);
      const clamped = Math.min(Math.max(index, 0), items.length - 1);
      const item = items[clamped];
      if (item !== undefined && item !== selected) onChange(item);
    });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full flex-1 snap-y snap-mandatory overflow-y-auto scrollbar-hide"
    >
      <div style={{ height: PAD_ROWS * ROW_HEIGHT }} />
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <button
            key={String(item)}
            type="button"
            onClick={() => {
              const el = containerRef.current;
              const index = items.indexOf(item);
              if (el && index >= 0) {
                el.scrollTo({ top: index * ROW_HEIGHT, behavior: "smooth" });
              }
              onChange(item);
            }}
            style={{ height: ROW_HEIGHT }}
            className={cn(
              "block w-full snap-center text-center tabular-nums transition-colors",
              isSelected
                ? "text-base font-bold text-primary"
                : "text-sm text-muted-foreground",
            )}
          >
            {item}
          </button>
        );
      })}
      <div style={{ height: PAD_ROWS * ROW_HEIGHT }} />
    </div>
  );
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() => parseTime(value));

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(parseTime(value));
    setOpen(next);
  };

  const handleOk = () => {
    onChange(toValue(draft.hour12, draft.minute, draft.period));
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm text-left outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1">{formatTimeLabel(value)}</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          className="isolate z-50 outline-none"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
        >
          <PopoverPrimitive.Popup className="z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 shadow-xl shadow-black/10 dark:shadow-black/45 outline-none transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0">
            <div className="relative flex" style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
              <WheelColumn
                items={HOURS}
                selected={draft.hour12}
                onChange={(hour12) => setDraft((d) => ({ ...d, hour12 }))}
              />
              <WheelColumn
                items={MINUTES}
                selected={draft.minute}
                onChange={(minute) => setDraft((d) => ({ ...d, minute }))}
              />
              <WheelColumn
                items={[...PERIODS]}
                selected={draft.period}
                onChange={(period) => setDraft((d) => ({ ...d, period }))}
              />
              {/* Solid-color fade so the wheel edges blend into the popup's own
                  opaque background — a CSS mask here would punch real alpha
                  holes and flash whatever sits behind the popup while scrolling. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-linear-to-b from-slate-50 dark:from-zinc-900 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-linear-to-t from-slate-50 dark:from-zinc-900 to-transparent" />
            </div>
            <div className="flex items-center justify-end gap-2 p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(glassBtnSubtleClass, "h-8 px-3 text-xs")}
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
