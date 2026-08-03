"use client";

import { useEffect, useState } from "react";
import { DoorOpen } from "lucide-react";
import { glassInputClass, glassSelectClass } from "@/components/ui/glass-field";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "@/components/assignments-exams/TaskCreateDialogShell";
import type { RoomPurposeDto } from "@/lib/types/operations-api";
import { cn } from "@/lib/utils";

export interface RoomFormValues {
  name: string;
  purpose: RoomPurposeDto;
  capacity: string;
  notes: string;
}

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSave: (values: RoomFormValues) => void | Promise<void>;
  /** When provided, the dialog opens in edit mode pre-filled with these values. */
  initialValues?: RoomFormValues | null;
}

const empty: RoomFormValues = {
  name: "",
  purpose: "CLASSROOM",
  capacity: "",
  notes: "",
};

export function RoomFormDialog({
  open,
  onOpenChange,
  saving = false,
  onSave,
  initialValues,
}: RoomFormDialogProps) {
  const isEdit = Boolean(initialValues);
  const [form, setForm] = useState<RoomFormValues>(initialValues ?? empty);

  useEffect(() => {
    if (open) setForm(initialValues ?? empty);
  }, [open, initialValues]);

  const canSubmit = form.name.trim().length > 0;

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={DoorOpen}
      title={isEdit ? "Edit room" : "Add room"}
      description={
        isEdit
          ? "Update this room's name, purpose, or capacity."
          : "Register a room so it can be picked when scheduling classes."
      }
      headerGradient="bg-gradient-to-br from-sky-500/15 via-sky-500/8 to-transparent"
      iconClassName="bg-sky-500/15 text-sky-600 ring-sky-500/25 dark:text-sky-400"
      saving={saving}
      canSubmit={canSubmit}
      submitLabel={isEdit ? "Save changes" : "Add room"}
      onSubmit={() => void onSave(form)}
    >
      <FormSection title="Room details" description="Name, purpose, and capacity.">
        <FormField label="Room name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Room 201, Lab A"
            className={cn(glassInputClass, "h-11")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Used for">
            <select
              value={form.purpose}
              onChange={(e) =>
                setForm({ ...form, purpose: e.target.value as RoomPurposeDto })
              }
              className={cn(glassSelectClass, "w-full")}
            >
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Lab room</option>
              <option value="SEMINAR">Seminar room</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <FormField label="Capacity" hint="Number of people, optional.">
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="e.g. 40"
              className={cn(glassInputClass, "h-11")}
            />
          </FormField>
        </div>

        <FormField label="Notes" hint="Optional.">
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Projector, whiteboard, AC…"
            className={cn(glassInputClass, "h-11")}
          />
        </FormField>
      </FormSection>
    </TaskCreateDialogShell>
  );
}
