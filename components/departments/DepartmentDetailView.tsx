"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronRight,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  GlassInput,
  glassSelectClass,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { GlassButton } from "@/components/ui/glass-button";
import { getApiErrorMessage } from "@/lib/api-error";
import { departmentService } from "@/lib/services/department-service";
import { facultyService } from "@/lib/services/faculty-service";
import { classService } from "@/lib/services/class-service";
import type { Department } from "@/data/departments";
import type { FacultySummaryDto } from "@/lib/types/faculty-api";
import type { ClassSummary } from "@/lib/types/class-api";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { cn } from "@/lib/utils";

const ACCENT_GRADIENT: Record<Department["accent"], string> = {
  violet: "from-violet-600 to-purple-700",
  blue: "from-blue-600 to-sky-700",
  emerald: "from-emerald-600 to-teal-700",
  amber: "from-amber-500 to-orange-600",
};

const ACCENTS: Department["accent"][] = ["violet", "blue", "emerald", "amber"];

function glassSectionStyle() {
  return {
    background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    border: "1px solid var(--glass-border-color)",
  } as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

interface DepartmentDetailViewProps {
  departmentId: string | null;
  onBack: () => void;
  onDepartmentNameLoaded?: (name: string) => void;
}

export function DepartmentDetailView({
  departmentId,
  onBack,
  onDepartmentNameLoaded,
}: DepartmentDetailViewProps) {
  const parsedId = departmentId ? Number(departmentId) : NaN;
  const { setParams } = useQueryParams();

  const [dept, setDept] = useState<Department | null>(null);
  const [faculties, setFaculties] = useState<FacultySummaryDto[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teachers = useMemo(() => {
    const byId = new Map<string, string>();
    for (const cls of classes) {
      if (cls.teacherId) byId.set(cls.teacherId, cls.teacherName);
    }
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }, [classes]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    facultyId: 0,
    headOfDept: "",
    capacityPercent: 50,
    status: "active" as Department["status"],
    accent: "violet" as Department["accent"],
  });

  const load = useCallback(async () => {
    if (!departmentId || Number.isNaN(parsedId)) {
      setLoading(false);
      setDept(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, facultyList, classPage] = await Promise.all([
        departmentService.getDepartment(parsedId),
        facultyService.listFaculties(),
        classService.listClasses({ departmentId: parsedId, size: 100 }),
      ]);
      const d = detail.department;
      const mapped: Department = {
        id: d.id,
        name: d.name,
        facultyId: d.facultyId ?? 0,
        facultyName: d.facultyName ?? "",
        headOfDept: d.headOfDept,
        teacherCount: d.teacherCount,
        classCount: d.classCount,
        capacityPercent: d.capacityPercent,
        status: d.status === "ACTIVE" ? "active" : "inactive",
        accent:
          (["VIOLET", "BLUE", "EMERALD", "AMBER"].includes(d.accent)
            ? (d.accent.toLowerCase() as Department["accent"])
            : "violet"),
      };
      setDept(mapped);
      setFaculties(facultyList);
      setClasses(classPage.items ?? []);
      onDepartmentNameLoaded?.(mapped.name);
    } catch {
      setError("Could not load department.");
      setDept(null);
    } finally {
      setLoading(false);
    }
  }, [departmentId, parsedId, onDepartmentNameLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = () => {
    if (!dept) return;
    setForm({
      name: dept.name,
      facultyId: dept.facultyId || faculties[0]?.id || 0,
      headOfDept: dept.headOfDept === "—" ? "" : dept.headOfDept,
      capacityPercent: dept.capacityPercent,
      status: dept.status,
      accent: dept.accent,
    });
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!dept || !form.facultyId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = departmentService.buildUpdatePayload({
        name: form.name,
        facultyId: form.facultyId,
        headOfDept: form.headOfDept,
        capacityPercent: form.capacityPercent,
        status: form.status,
      });
      payload.accent = form.accent.toUpperCase() as
        | "VIOLET"
        | "BLUE"
        | "EMERALD"
        | "AMBER";
      const updated = await departmentService.updateDepartment(dept.id, payload);
      setDept(updated);
      onDepartmentNameLoaded?.(updated.name);
      setEditing(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not save department."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!dept) return;
    if (
      !window.confirm(
        `Delete department “${dept.name}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await departmentService.deleteDepartment(dept.id);
      onBack();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not delete department."));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-destructive">{error ?? "Department not found."}</p>
        <GlassButton subtle className="h-9 px-4 text-xs font-semibold" onClick={onBack}>
          Back to departments
        </GlassButton>
      </div>
    );
  }

  const isActive = dept.status === "active";

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-3 pb-5">
        <GlassButton
          subtle
          className="h-9 w-9 rounded-xl shrink-0"
          aria-label="Back to departments"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </GlassButton>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4 pb-6">
        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Hero */}
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6",
            ACCENT_GRADIENT[dept.accent],
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
          <Building2 className="pointer-events-none absolute -right-4 top-1/2 h-40 w-40 -translate-y-1/2 rotate-12 text-white/10" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
                Department
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
                  isActive
                    ? "bg-emerald-500/90 text-white"
                    : "bg-white/15 text-white/90 ring-1 ring-white/25",
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow-sm">
                {dept.name}
              </h1>
              {dept.facultyName && (
                <p className="text-sm font-medium text-white/85">{dept.facultyName}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                <Users className="h-3.5 w-3.5 opacity-90" />
                <span className="tabular-nums">{teachers.length}</span>
                <span className="opacity-90">teachers</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                <BookOpen className="h-3.5 w-3.5 opacity-90" />
                <span className="tabular-nums">{dept.classCount}</span>
                <span className="opacity-90">classes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Department details */}
        <Card bouncy={false} className="rounded-2xl p-5 space-y-4" style={glassSectionStyle()}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-foreground">Department details</h3>
            {editing ? (
              <div className="flex items-center gap-2">
                <GlassButton
                  subtle
                  className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </GlassButton>
                <button
                  type="button"
                  disabled={saving || !form.facultyId}
                  onClick={() => void handleSave()}
                  className={cn(glassBtnPrimaryClass, "h-8 px-3 text-xs gap-1.5")}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
            ) : (
              <GlassButton
                subtle
                className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
                onClick={startEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </GlassButton>
            )}
          </div>

          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Department name</Label>
                <GlassInput
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Faculty</Label>
                <select
                  className={glassSelectClass}
                  value={form.facultyId || ""}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, facultyId: Number(e.target.value) }))
                  }
                  disabled={faculties.length === 0}
                >
                  {faculties.length === 0 ? (
                    <option value="">No faculties</option>
                  ) : (
                    faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Head of department</Label>
                <GlassInput
                  value={form.headOfDept}
                  onChange={(e) => setForm((c) => ({ ...c, headOfDept: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Capacity %</Label>
                <GlassInput
                  type="number"
                  min={0}
                  max={100}
                  value={form.capacityPercent}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      capacityPercent: Math.min(
                        100,
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <select
                  className={glassSelectClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      status: e.target.value as Department["status"],
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Accent</Label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, accent }))}
                      className={cn(
                        "h-8 w-8 rounded-lg bg-gradient-to-br ring-offset-2 ring-offset-background transition-all",
                        ACCENT_GRADIENT[accent],
                        form.accent === accent
                          ? "ring-2 ring-foreground/60 scale-105"
                          : "opacity-70 hover:opacity-100",
                      )}
                      aria-label={accent}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Faculty" value={dept.facultyName} />
              <DetailRow label="Head of department" value={dept.headOfDept} />
              <DetailRow label="Status" value={isActive ? "Active" : "Inactive"} />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Capacity
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", ACCENT_GRADIENT[dept.accent])}
                      style={{ width: `${dept.capacityPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {dept.capacityPercent}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Instructors */}
        <h3 className="text-sm font-extrabold text-foreground">Instructors</h3>
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No instructors yet — instructors show up here once a class in this department has one.
          </p>
        ) : (
          <Card bouncy={false} className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left border-collapse text-[12px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
                    <th className="px-5 py-3">Instructor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="glass-panel-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-muted-foreground">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate font-medium text-foreground">{teacher.name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Classes */}
        <h3 className="text-sm font-extrabold text-foreground">Classes</h3>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        ) : (
          <Card bouncy={false} className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left border-collapse text-[12px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Enrolled</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80">
                  {classes.map((cls) => (
                    <tr
                      key={cls.id}
                      className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors cursor-pointer"
                      onClick={() =>
                        setParams({
                          [QueryKey.view]: "class-detail",
                          [QueryKey.course]: String(cls.id),
                        })
                      }
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="glass-panel-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{cls.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {cls.code} · {cls.teacherName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{cls.enrolledCount}</td>
                      <td className="px-5 py-3.5">
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {cls.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="h-4 w-4 inline-block text-muted-foreground/50" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Danger zone */}
        <Card
          bouncy={false}
          className="rounded-2xl p-5 border border-rose-500/20"
          style={{
            background: "var(--glass-bg-subtle)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
          }}
        >
          <h3 className="text-sm font-extrabold text-destructive mb-1">Danger zone</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this department. Only possible when it has no classes.
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className={cn(
              glassBtnSubtleClass,
              "h-9 px-4 text-xs gap-1.5 text-destructive border border-destructive/30",
            )}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete department
          </button>
        </Card>
      </div>
    </div>
  );
}
