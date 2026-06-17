"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  Search,
  Users,
  User,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { classService } from "@/lib/services/class-service";
import type { ClassConfigDto, ClassStatus, ClassSummary } from "@/lib/types/class-api";
import {
  parseSemesterFilter,
  resolveSemesterSelection,
  semesterToParam,
} from "@/lib/class-display";
import { CreateClassDialog } from "./CreateClassDialog";
import { ClassStudentsDialog } from "./ClassStudentsDialog";
import { ClassPreviewSheet } from "./ClassPreviewSheet";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { cn } from "@/lib/utils";
import { CLASSES_UPDATED_EVENT } from "@/components/notifications/notification-context";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { GlassSearchInput, GlassSelect } from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion";

type UserRole = "student" | "teacher" | "admin";

interface DisplayClass {
  summary: ClassSummary;
  iconBg: string;
  description: string;
  statusLabel: string;
  semesterLabel: string;
}

interface ClassesViewProps {
  onEnterClass?: (payload: {
    classId: string;
    title: string;
    module: string;
  }) => void;
}

export function ClassesView({ onEnterClass }: ClassesViewProps) {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const [classConfig, setClassConfig] = useState<ClassConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const selectedSemester = classConfig
    ? resolveSemesterSelection(get(QueryKey.semester), classConfig.allSemestersLabel)
    : "";

  const setSelectedSemester = useCallback(
    (label: string) => {
      if (!classConfig) return;
      setParams({
        [QueryKey.semester]: semesterToParam(label, classConfig.allSemestersLabel),
      });
    },
    [setParams, classConfig]
  );

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as UserRole) ?? "student";
  const [classes, setClasses] = useState<DisplayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [previewClass, setPreviewClass] = useState<DisplayClass | null>(null);

  const teacherUserId =
    role === "teacher" && currentUser?.userId ? currentUser.userId : null;

  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isStudent = role === "student";
  const canCreateClass = isTeacher || isAdmin;
  const canViewRoster = isTeacher || isAdmin;
  const canManageClass = isTeacher || isAdmin;

  const { confirm } = useConfirm();
  const [deletingClassId, setDeletingClassId] = useState<number | null>(null);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    classService
      .getClassConfig()
      .then((config) => {
        if (!cancelled) {
          setClassConfig(config);
          setConfigError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClassConfig(null);
          setConfigError("Could not load class options. Please refresh the page.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadClasses = useCallback(async () => {
    if (!classConfig) return;
    setLoading(true);
    setLoadError(null);
    try {
      const semesterFilter = parseSemesterFilter(
        selectedSemester,
        classConfig.semesterFilters
      );
      const page = await classService.listClasses({
        search: searchQuery.trim() || undefined,
        semester: semesterFilter.semester,
        academicYear: semesterFilter.academicYear,
        size: 50,
      });

      const items = page.items ?? [];
      const withMeta: DisplayClass[] = await Promise.all(
        items.map(async (summary) => {
          let description = "";
          try {
            const detail = await classService.getClass(summary.id);
            description = detail.description?.trim() ?? "";
          } catch {
            description = "";
          }
          const semesterLabel = summary.semesterLabel?.trim() || "—";
          return {
            summary,
            iconBg: summary.cardGradient,
            description:
              description ||
              semesterLabel ||
              "Open this class to view lessons and materials.",
            statusLabel: summary.statusLabel,
            semesterLabel,
          };
        })
      );

      setClasses(withMeta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 403
          ? "You do not have permission to view these classes."
          : "Could not load classes. Please try again.";
      setLoadError(message);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSemester, classConfig]);

  useEffect(() => {
    if (userLoading || !classConfig) return;
    void loadClasses();
  }, [userLoading, classConfig, loadClasses]);

  useEffect(() => {
    const onClassesUpdated = () => void loadClasses();
    window.addEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
    return () => window.removeEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
  }, [loadClasses]);


  const handleDeleteClass = async (cls: ClassSummary) => {
    const ok = await confirm(
      `"${cls.name}" and all its lessons will be permanently deleted. This cannot be undone.`,
      { title: "Delete Class", confirmLabel: "Delete", variant: "destructive" }
    );
    if (!ok) return;
    setDeletingClassId(cls.id);
    try {
      await classService.deleteClass(cls.id);
      void loadClasses();
    } catch {
      // list will reflect real state on next load
    } finally {
      setDeletingClassId(null);
    }
  };

  const headerBadge = isStudent
    ? "Enrolled"
    : isTeacher
      ? "Teaching"
      : "All";

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {canCreateClass && (
        <div className="pt-3 shrink-0 flex justify-end">
          <Button
            size="sm"
            className="gap-1.5 font-bold h-8.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Class
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-3 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <GlassSearchInput
            placeholder="Search classes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <GlassSelect
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={!classConfig}
            className="w-full sm:w-auto"
          >
            {(classConfig?.semesterFilters ?? []).map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </GlassSelect>
        </div>

        {configError && (
          <p className="text-xs text-rose-600 font-medium">{configError}</p>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && loadError && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void loadClasses()}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !loadError && classes.length > 0 && (
          <BouncyStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((displayClass) => {
              const { summary: cls, iconBg, description, statusLabel, semesterLabel } =
                displayClass;
              return (
              <BouncyStaggerItem key={cls.id} enter="simple">
              <Card
                bouncy={false}
                className="border border-slate-200/80 dark:border-zinc-800/80 hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md flex flex-col overflow-hidden h-full"
              >
                {/* clickable banner */}
                <button
                  type="button"
                  className={`h-24 bg-linear-to-br ${iconBg} relative overflow-hidden flex items-center justify-center w-full text-left`}
                  onClick={() => setPreviewClass(displayClass)}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <BookOpen className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge
                      className={
                        cls.status === "ACTIVE"
                          ? "bg-emerald-500 text-white font-bold"
                          : "bg-amber-500 text-white font-bold"
                      }
                    >
                      {statusLabel}
                    </Badge>
                    <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md">
                      {cls.code}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white text-center px-4 leading-tight drop-shadow-md">
                    {cls.name}
                  </h3>
                </button>

                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  <div
                    className="text-left flex-1 flex flex-col gap-3 cursor-pointer"
                    onClick={() => setPreviewClass(displayClass)}
                  >
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        {cls.teacherName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        {cls.enrolledCount} Students
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {semesterLabel}
                    </p>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
                      {description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 text-xs"
                      onClick={() => setPreviewClass(displayClass)}
                    >
                      View details
                    </Button>

                    {canManageClass && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Class options"
                          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground outline-none"
                        >
                          {deletingClassId === cls.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingClass(cls)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void handleDeleteClass(cls)}
                            disabled={deletingClassId === cls.id}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
              </BouncyStaggerItem>
            );
            })}
          </BouncyStagger>
        )}

        {!loading && !loadError && classes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--glass-bg-subtle)",
                  backdropFilter: "blur(16px) saturate(1.5)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">No Classes Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {isStudent
                  ? "You have no classes yet. Accept an invitation from your teacher in the notification bell."
                  : canCreateClass
                    ? "Create a class, then open the roster to invite students."
                    : "No classes matched your filters."}
              </p>
            </div>
          )}
      </div>

      <CreateClassDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isAdmin={isAdmin}
        currentTeacherId={teacherUserId ?? undefined}
        classConfig={classConfig}
        onCreated={() => void loadClasses()}
      />

      <ClassStudentsDialog
        open={rosterClass !== null}
        onOpenChange={(open) => !open && setRosterClass(null)}
        classId={rosterClass?.id ?? null}
        className={rosterClass?.name ?? ""}
        canManage={canViewRoster}
      />

      {editingClass && (
        <EditClassDialog
          klass={editingClass}
          onOpenChange={(open) => { if (!open) setEditingClass(null); }}
          onSaved={() => {
            setEditingClass(null);
            void loadClasses();
          }}
        />
      )}

      <ClassPreviewSheet
        open={previewClass !== null}
        onOpenChange={(open) => !open && setPreviewClass(null)}
        classSummary={previewClass?.summary ?? null}
        description={previewClass?.description ?? ""}
        semesterLabel={previewClass?.semesterLabel ?? ""}
        statusLabel={previewClass?.statusLabel ?? "Active"}
        canViewRoster={canViewRoster}
        isStudent={isStudent}
        gradingWeights={classConfig?.gradingWeights ?? {
          attendance: 10,
          assignment: 10,
          quiz: 5,
          midterm: 25,
          finalExam: 50,
        }}
        onEnterClass={() => {
          if (!previewClass) return;
          onEnterClass?.({
            classId: String(previewClass.summary.id),
            title: previewClass.summary.name,
            module: previewClass.semesterLabel,
          });
          setPreviewClass(null);
        }}
        onManageRoster={() => {
          if (!previewClass) return;
          setRosterClass({
            id: previewClass.summary.id,
            name: previewClass.summary.name,
          });
          setPreviewClass(null);
        }}
      />

    </div>
  );
}

/* ─── Edit Class Dialog ─────────────────────────────────────────────────── */

function EditClassDialog({
  klass,
  onOpenChange,
  onSaved,
}: {
  klass: ClassSummary;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(klass.name);
  const [code, setCode] = useState(klass.code);
  const [semester, setSemester] = useState(klass.semester ?? "");
  const [academicYear, setAcademicYear] = useState(
    klass.academicYear != null ? String(klass.academicYear) : ""
  );
  const [status, setStatus] = useState<ClassStatus>(klass.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await classService.updateClass(klass.id, {
        name: name.trim(),
        code: code.trim(),
        semester: semester.trim() || undefined,
        academicYear: academicYear ? Number(academicYear) : undefined,
        status,
      });
      onSaved();
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <Pencil className="h-4 w-4 text-violet-500" />
            Edit Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Class name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" placeholder="e.g. Mathematics 101" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Class code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-sm" placeholder="e.g. MATH101" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Semester</Label>
              <Input value={semester} onChange={(e) => setSemester(e.target.value)} className="h-9 text-sm" placeholder="e.g. Semester 1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic year</Label>
              <Input type="number" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="h-9 text-sm" placeholder="e.g. 2025" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClassStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={saving || !name.trim() || !code.trim()} onClick={() => void handleSave()}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
