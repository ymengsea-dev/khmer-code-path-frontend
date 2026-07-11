"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { glassInputClass, glassSelectClass } from "@/components/ui/glass-field";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "@/components/assignments-exams/TaskCreateDialogShell";
import type { RequestIcon } from "@/data/operations";
import { cn } from "@/lib/utils";

export interface RequestFormValues {
  title: string;
  icon: RequestIcon;
  detail: string;
}

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSave: (values: RequestFormValues) => void | Promise<void>;
}

const empty: RequestFormValues = {
  title: "",
  icon: "room",
  detail: "",
};

const RESOURCE_TYPES: { value: RequestIcon; label: string }[] = [
  { value: "room", label: "Room / Facility" },
  { value: "video", label: "Projector / AV" },
  { value: "laptop", label: "Laptop / Device" },
];

export function RequestDialog({
  open,
  onOpenChange,
  saving = false,
  onSave,
}: RequestDialogProps) {
  const [form, setForm] = useState<RequestFormValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const canSubmit = form.title.trim().length > 0;

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Send}
      title="Request a resource"
      description="Ask the school office for equipment, a room, or a device. An admin will review it."
      headerGradient="bg-gradient-to-br from-violet-500/15 via-violet-500/8 to-transparent"
      iconClassName="bg-violet-500/15 text-violet-600 ring-violet-500/25 dark:text-violet-400"
      saving={saving}
      canSubmit={canSubmit}
      submitLabel="Submit request"
      onSubmit={() => void onSave(form)}
    >
      <FormSection title="Request details" description="What you need and why.">
        <FormField label="What do you need?">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Projector for Room 201"
            className={cn(glassInputClass, "h-11")}
          />
        </FormField>

        <FormField label="Resource type">
          <select
            value={form.icon}
            onChange={(e) =>
              setForm({ ...form, icon: e.target.value as RequestIcon })
            }
            className={cn(glassSelectClass, "w-full")}
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Details" hint="When you need it, for which class, etc.">
          <textarea
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            placeholder="Add any context that helps the office fulfil this…"
            rows={4}
            className={cn(glassInputClass, "min-h-24 resize-none py-2.5")}
          />
        </FormField>
      </FormSection>
    </TaskCreateDialogShell>
  );
}
