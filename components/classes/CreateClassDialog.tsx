"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { ClassConfigDto } from "@/lib/types/class-api";
import { Loader2 } from "lucide-react";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  classConfig: ClassConfigDto | null;
  /** Admins pick any teacher; teachers create classes assigned to themselves. */
  isAdmin?: boolean;
  currentTeacherId?: string;
}

export function CreateClassDialog({
  open,
  onOpenChange,
  onCreated,
  classConfig,
  isAdmin = false,
  currentTeacherId,
}: CreateClassDialogProps) {
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schedule, setSchedule] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const semesterOptions = useMemo(
    () =>
      (classConfig?.semesterFilters ?? []).filter(
        (f) => f.semester != null && f.semester !== ""
      ),
    [classConfig]
  );

  useEffect(() => {
    if (!open || !classConfig) return;
    setError(null);
    const defs = classConfig.createDefaults;
    setSemester(defs.semester);
    setAcademicYear(String(defs.academicYear));
  }, [open, classConfig]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!isAdmin) {
      if (currentTeacherId) setTeacherId(currentTeacherId);
      setTeachers([]);
      return;
    }
    setLoadingTeachers(true);
    userService
      .listUsers({ role: "TEACHER", size: 100 })
      .then((page) => {
        setTeachers(page.items ?? []);
        if (page.items?.[0]) setTeacherId(page.items[0].id);
      })
      .catch(() => setError("Could not load teachers."))
      .finally(() => setLoadingTeachers(false));
  }, [open, isAdmin, currentTeacherId]);

  const handleSemesterPick = (label: string) => {
    const match = semesterOptions.find((o) => o.value === label);
    if (match?.semester) {
      setSemester(match.semester);
      if (match.academicYear != null) {
        setAcademicYear(String(match.academicYear));
      }
    } else {
      setSemester(label);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classConfig) {
      setError("Class options are still loading. Try again in a moment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const assignedTeacherId = isAdmin ? teacherId : (currentTeacherId ?? teacherId);
      if (!assignedTeacherId) {
        setError("Could not determine your teacher account. Sign in again.");
        return;
      }
      await classService.createClass({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        teacherId: assignedTeacherId,
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

  const selectedSemesterLabel =
    semesterOptions.find(
      (o) =>
        o.semester === semester &&
        (o.academicYear == null || String(o.academicYear) === academicYear)
    )?.value ??
    (semester && academicYear ? `${semester}, ${academicYear}` : semester);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold">Create Class</DialogTitle>
          <DialogDescription className="text-xs">
            {isAdmin
              ? "Assign a teacher and set up a new class for student enrollment."
              : "Set up a new class you will teach. Invite students from the class roster after creating."}
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

          {isAdmin ? (
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
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Semester</Label>
              {semesterOptions.length > 0 ? (
                <select
                  value={selectedSemesterLabel}
                  onChange={(e) => handleSemesterPick(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  {semesterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="h-9 text-sm"
                  disabled={!classConfig}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic year</Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                type="number"
                className="h-9 text-sm"
                disabled={!classConfig}
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
            disabled={
              submitting ||
              !classConfig ||
              (!isAdmin && !currentTeacherId) ||
              (isAdmin && !teacherId)
            }
            className="w-full font-bold h-9"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
