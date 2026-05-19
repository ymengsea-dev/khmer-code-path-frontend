"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classService } from "@/lib/services/class-service";
import { userService } from "@/lib/services/user-service";
import type { UserSummary } from "@/lib/services/user-service";
import { Loader2 } from "lucide-react";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateClassDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateClassDialogProps) {
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [academicYear, setAcademicYear] = useState("2026");
  const [schedule, setSchedule] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoadingTeachers(true);
    userService
      .listUsers({ role: "TEACHER", size: 100 })
      .then((page) => {
        setTeachers(page.items ?? []);
        if (page.items?.[0]) setTeacherId(page.items[0].id);
      })
      .catch(() => setError("Could not load teachers."))
      .finally(() => setLoadingTeachers(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await classService.createClass({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        teacherId,
        semester: semester.trim() || undefined,
        academicYear: Number(academicYear) || undefined,
        schedule: schedule.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        status: "ACTIVE",
      });
      onCreated();
      onOpenChange(false);
      setCode("");
      setName("");
      setDescription("");
      setSchedule("");
      setRoomNumber("");
    } catch {
      setError("Failed to create class. Check the code is unique and you have permission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold">Create Class</DialogTitle>
          <DialogDescription className="text-xs">
            Assign a teacher and set up a new class for student enrollment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-semibold">Class code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CS101-2026-S1"
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-semibold">Class name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Introduction to CS"
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Teacher</Label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              disabled={loadingTeachers}
              className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Semester</Label>
              <Input
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic year</Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                type="number"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Schedule</Label>
              <Input
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Mon 08:00-10:00"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Room</Label>
              <Input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="B201"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !teacherId}
            className="w-full font-bold h-9"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
