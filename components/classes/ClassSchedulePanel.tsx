"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { glassBtnPrimaryClass, glassInputClass } from "@/components/ui/glass-field";
import { classService } from "@/lib/services/class-service";
import type { ScheduleConflict, ScheduleSlot, ScheduleSlotInput, WeekDay } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";

const DAYS: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABEL: Record<WeekDay, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

interface ClassSchedulePanelProps {
  classId: number;
  editing: boolean;
}

/** Trim a backend "HH:mm:ss" time to the "HH:mm" an <input type="time"> expects. */
function toInputTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function ClassSchedulePanel({ classId, editing }: ClassSchedulePanelProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [draft, setDraft] = useState<ScheduleSlotInput[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await classService.getSchedule(classId);
      setSlots(rows);
    } catch {
      setError("Could not load the timetable.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Seed the editable draft from the loaded slots whenever edit mode opens.
  useEffect(() => {
    if (editing) {
      setDraft(
        slots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: toInputTime(s.startTime),
          endTime: toInputTime(s.endTime),
          room: s.room ?? "",
        })),
      );
      setConflicts([]);
      setSuccess(null);
      setError(null);
    }
  }, [editing, slots]);

  const addRow = () => {
    setDraft((prev) => [
      ...prev,
      { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", room: "" },
    ]);
  };

  const removeRow = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, patch: Partial<ScheduleSlotInput>) => {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const persist = async (force: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await classService.replaceSchedule(classId, draft, force);
      setSlots(saved);
      setConflicts([]);
      setSuccess("Timetable saved.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        try {
          const found = await classService.previewScheduleConflicts(classId, draft);
          setConflicts(found);
          setError("Schedule conflicts detected. Review below, then Save anyway to override.");
        } catch {
          setError("Schedule conflict detected.");
        }
      } else {
        setError("Could not save the timetable.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Read view — weekly grid grouped by day.
  if (!editing) {
    const byDay = DAYS.map((day) => ({
      day,
      items: slots
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
    const hasAny = slots.length > 0;
    return (
      <div className="space-y-3">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No timetable yet. Click Edit to add day/time slots.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {byDay
              .filter((d) => d.items.length > 0)
              .map(({ day, items }) => (
                <div key={day} className="rounded-xl border border-black/5 dark:border-white/8 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {DAY_LABEL[day]}
                  </p>
                  {items.map((s) => (
                    <div key={s.id} className="text-sm font-semibold">
                      {toInputTime(s.startTime)}–{toInputTime(s.endTime)}
                      {s.room ? (
                        <span className="text-muted-foreground font-normal"> · {s.room}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }

  // Edit view — editable rows.
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add day/time slots. Conflicts on the same room or teacher are blocked unless you choose
        Save anyway.
      </p>

      <div className="space-y-2">
        {draft.map((row, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <select
              value={row.dayOfWeek}
              onChange={(e) => updateRow(index, { dayOfWeek: e.target.value as WeekDay })}
              className={cn(glassInputClass, "h-10 w-28")}
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {DAY_LABEL[day]}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={row.startTime}
              onChange={(e) => updateRow(index, { startTime: e.target.value })}
              className={cn(glassInputClass, "h-10 w-28")}
            />
            <input
              type="time"
              value={row.endTime}
              onChange={(e) => updateRow(index, { endTime: e.target.value })}
              className={cn(glassInputClass, "h-10 w-28")}
            />
            <input
              type="text"
              placeholder="Room"
              value={row.room ?? ""}
              onChange={(e) => updateRow(index, { room: e.target.value })}
              className={cn(glassInputClass, "h-10 flex-1 min-w-[100px]")}
            />
            <GlassButton
              subtle
              className="h-9 w-9 p-0 rounded-lg shrink-0"
              onClick={() => removeRow(index)}
              aria-label="Remove slot"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </GlassButton>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        <Plus className="h-4 w-4" /> Add slot
      </button>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Conflicts
          </p>
          <ul className="space-y-1 text-[11px] text-amber-700 dark:text-amber-400">
            {conflicts.map((c, i) => (
              <li key={i}>
                {DAY_LABEL[c.dayOfWeek]} {toInputTime(c.startTime)}–{toInputTime(c.endTime)}
                {c.room ? ` · ${c.room}` : ""} — {c.reason === "ROOM" ? "same room" : "same teacher"} as{" "}
                {c.otherClassName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => void persist(false)}
          disabled={saving}
          className={cn(glassBtnPrimaryClass, "gap-2 h-10 px-4 disabled:opacity-50")}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save timetable
        </button>
        {conflicts.length > 0 && (
          <button
            type="button"
            onClick={() => void persist(true)}
            disabled={saving}
            className="h-10 px-4 rounded-xl text-sm font-semibold border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
          >
            Save anyway
          </button>
        )}
      </div>

      {success && <p className="text-xs text-emerald-600">{success}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
