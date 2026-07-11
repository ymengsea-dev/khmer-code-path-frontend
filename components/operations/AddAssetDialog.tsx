"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { glassInputClass, glassSelectClass } from "@/components/ui/glass-field";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "@/components/assignments-exams/TaskCreateDialogShell";
import type { AssetStatus } from "@/data/operations";
import { cn } from "@/lib/utils";

export interface AssetFormValues {
  name: string;
  category: string;
  status: AssetStatus;
  location: string;
  assignedTo: string;
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSave: (values: AssetFormValues) => void | Promise<void>;
  /** When provided, the dialog opens in edit mode pre-filled with these values. */
  initialValues?: AssetFormValues | null;
}

const empty: AssetFormValues = {
  name: "",
  category: "Computer",
  status: "available",
  location: "",
  assignedTo: "",
};

export function AddAssetDialog({
  open,
  onOpenChange,
  saving = false,
  onSave,
  initialValues,
}: AddAssetDialogProps) {
  const isEdit = Boolean(initialValues);
  const [form, setForm] = useState<AssetFormValues>(initialValues ?? empty);

  useEffect(() => {
    if (open) setForm(initialValues ?? empty);
  }, [open, initialValues]);

  const canSubmit =
    form.name.trim().length > 0 &&
    form.category.trim().length > 0 &&
    form.location.trim().length > 0;

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Package}
      title={isEdit ? "Edit asset" : "Add asset"}
      description={
        isEdit
          ? "Update this asset's details, status, or assignment."
          : "Register a physical asset so it can be tracked and assigned."
      }
      headerGradient="bg-gradient-to-br from-violet-500/15 via-violet-500/8 to-transparent"
      iconClassName="bg-violet-500/15 text-violet-600 ring-violet-500/25 dark:text-violet-400"
      saving={saving}
      canSubmit={canSubmit}
      submitLabel={isEdit ? "Save changes" : "Add asset"}
      onSubmit={() => void onSave(form)}
    >
      <FormSection title="Asset details" description="Name, category, and where it lives.">
        <FormField label="Asset name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Dell Latitude 5540"
            className={cn(glassInputClass, "h-11")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category">
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Computer, Projector…"
              className={cn(glassInputClass, "h-11")}
            />
          </FormField>
          <FormField label="Location">
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Room 201"
              className={cn(glassInputClass, "h-11")}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}
              className={cn(glassSelectClass, "w-full")}
            >
              <option value="available">Available</option>
              <option value="in-use">In use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </FormField>
          <FormField label="Assigned to" hint="Leave blank if unassigned.">
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              placeholder="Optional"
              className={cn(glassInputClass, "h-11")}
            />
          </FormField>
        </div>
      </FormSection>
    </TaskCreateDialogShell>
  );
}
