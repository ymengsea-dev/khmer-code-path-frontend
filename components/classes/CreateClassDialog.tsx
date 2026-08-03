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
import { TimePicker } from "@/components/ui/time-picker";
import { classService } from "@/lib/services/class-service";
import { userService } from "@/lib/services/user-service";
import type { UserSummary } from "@/lib/services/user-service";
import type { ClassConfigDto } from "@/lib/types/class-api";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function slugPart(value: string, maxLen: number): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLen);
}

function generateClassCode(name: string, semester: string, academicYear: string): string {
  const namePart = slugPart(name, 6) || "CLASS";
  const semesterPart = slugPart(semester, 3);
  const yearPart = slugPart(academicYear, 4);
  const suffix = Math.floor(100 + Math.random() * 900);
  return [namePart, yearPart, semesterPart, suffix].filter(Boolean).join("-");
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Compresses a set of days into ranges, e.g. Mon-Fri instead of Mon, Tue, Wed, Thu, Fri. */
function formatDaysLabel(days: string[]): string {
  const sorted = WEEK_DAYS.filter((d) => days.includes(d));
  if (sorted.length === 0) return "";
  const parts: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const day = sorted[i];
    const isConsecutive =
      day && WEEK_DAYS.indexOf(day) === WEEK_DAYS.indexOf(rangeEnd) + 1;
    if (isConsecutive) {
      rangeEnd = day;
      continue;
    }
    parts.push(rangeStart === rangeEnd ? rangeStart : `${rangeStart}-${rangeEnd}`);
    if (day) {
      rangeStart = day;
      rangeEnd = day;
    }
  }
  return parts.join(", ");
}

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

  const [codeMode, setCodeMode] = useState<"auto" | "manual">("auto");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [scheduleDays, setScheduleDays] = useState<string[]>(["Mon"]);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("10:00");
  const [roomNumber, setRoomNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const toggleScheduleDay = (day: string) => {
    setScheduleDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      return [...prev, day];
    });
  };

  const roomOptions = classConfig?.roomOptions ?? [];

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
    const firstDept = classConfig.departmentOptions?.[0];
    if (firstDept) setDepartmentId(String(firstDept.id));
    const firstRoom = classConfig.roomOptions?.[0];
    if (firstRoom) setRoomNumber(firstRoom.name);
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

  useEffect(() => {
    if (!open || codeMode !== "auto") return;
    setCode(generateClassCode(name, semester, academicYear));
    // Regenerate only when the inputs feeding the code change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, codeMode, name, semester, academicYear]);

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
      const parsedDepartmentId = Number(departmentId);
      if (!Number.isFinite(parsedDepartmentId) || parsedDepartmentId <= 0) {
        setError("Select a department for this class.");
        return;
      }
      const schedule =
        scheduleDays.length && scheduleStart && scheduleEnd
          ? `${formatDaysLabel(scheduleDays)} ${scheduleStart}-${scheduleEnd}`
          : undefined;
      await classService.createClass({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        teacherId: assignedTeacherId,
        departmentId: parsedDepartmentId,
        semester: semester.trim() || undefined,
        academicYear: Number(academicYear) || undefined,
        schedule,
        roomNumber: roomNumber.trim() || undefined,
        status: "ACTIVE",
      });
      onCreated();
      onOpenChange(false);
      setCodeMode("auto");
      setCode("");
      setName("");
      setDescription("");
      setScheduleDays(["Mon"]);
      setScheduleStart("08:00");
      setScheduleEnd("10:00");
      setRoomNumber(classConfig?.roomOptions?.[0]?.name ?? "");
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
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col p-0 gap-0 max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-extrabold">Create Class</DialogTitle>
          <DialogDescription className="text-xs">
            {isAdmin
              ? "Assign a teacher and set up a new class for student enrollment."
              : "Set up a new class you will teach. Invite students from the class roster after creating."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-4"
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class code</Label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CS101-2026-S1"
                    required
                    readOnly={codeMode === "auto"}
                    className={cn(
                      "h-9 pr-14 text-sm",
                      codeMode === "auto" && "text-muted-foreground",
                    )}
                  />
                  <label
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer select-none items-center gap-1 text-[10px] font-semibold text-muted-foreground"
                    title="Auto-generate class code"
                  >
                    <input
                      type="checkbox"
                      checked={codeMode === "auto"}
                      onChange={(e) => setCodeMode(e.target.checked ? "auto" : "manual")}
                      className="h-3 w-3 accent-current"
                    />
                    Auto
                  </label>
                </div>
                {codeMode === "auto" && (
                  <button
                    type="button"
                    onClick={() => setCode(generateClassCode(name, semester, academicYear))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200/80 dark:border-zinc-800 hover:bg-muted"
                    aria-label="Regenerate class code"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Department</Label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              disabled={!classConfig || (classConfig.departmentOptions?.length ?? 0) === 0}
              className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
            >
              {(classConfig?.departmentOptions ?? []).length === 0 ? (
                <option value="">No departments — ask your admin to add one</option>
              ) : (
                (classConfig?.departmentOptions ?? []).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.facultyName} · {opt.name}
                  </option>
                ))
              )}
            </select>
          </div>

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

          <div className="space-y-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Schedule</Label>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatDaysLabel(scheduleDays)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleScheduleDay(day)}
                    className={cn(
                      "h-7 flex-1 min-w-9 rounded-md text-[11px] font-semibold transition-colors border",
                      scheduleDays.includes(day)
                        ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                        : "border-slate-200/80 dark:border-zinc-800 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Start time
                </Label>
                <TimePicker value={scheduleStart} onChange={setScheduleStart} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  End time
                </Label>
                <TimePicker value={scheduleEnd} onChange={setScheduleEnd} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Room
              </Label>
              {roomOptions.length > 0 ? (
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.name}>
                      {room.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="B201"
                  className="h-9 text-sm"
                />
              )}
            </div>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <Button
            type="submit"
            disabled={
              submitting ||
              !classConfig ||
              (classConfig.departmentOptions?.length ?? 0) === 0 ||
              !departmentId ||
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
