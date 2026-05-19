"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Department } from "@/data/departments";

export interface DepartmentFormValues {
  name: string;
  faculty: string;
  headOfDept: string;
  facultyCount: number;
  capacityPercent: number;
  status: Department["status"];
}

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: Department | null;
  saving?: boolean;
  onSave: (values: DepartmentFormValues) => void | Promise<void>;
}

const empty: DepartmentFormValues = {
  name: "",
  faculty: "",
  headOfDept: "",
  facultyCount: 0,
  capacityPercent: 50,
  status: "active",
};

export function DepartmentFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  saving = false,
  onSave,
}: DepartmentFormDialogProps) {
  const [form, setForm] = useState<DepartmentFormValues>(empty);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name,
        faculty: initial.faculty,
        headOfDept: initial.headOfDept,
        facultyCount: initial.facultyCount,
        capacityPercent: initial.capacityPercent,
        status: initial.status,
      });
    } else {
      setForm(empty);
    }
  }, [open, mode, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add department" : "Edit department"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new academic unit."
              : "Update department details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dept-faculty">Faculty / school</Label>
            <Input
              id="dept-faculty"
              value={form.faculty}
              onChange={(e) => setForm({ ...form, faculty: e.target.value })}
              placeholder="Faculty of Engineering"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dept-hod">Head of department</Label>
            <Input
              id="dept-hod"
              value={form.headOfDept}
              onChange={(e) =>
                setForm({ ...form, headOfDept: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="dept-count">Faculty count</Label>
              <Input
                id="dept-count"
                type="number"
                min={0}
                value={form.facultyCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    facultyCount: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dept-capacity">Capacity %</Label>
              <Input
                id="dept-capacity"
                type="number"
                min={0}
                max={100}
                value={form.capacityPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacityPercent: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  })
                }
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dept-status">Status</Label>
            <select
              id="dept-status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-2xs"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Department["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : mode === "add"
                  ? "Create"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
