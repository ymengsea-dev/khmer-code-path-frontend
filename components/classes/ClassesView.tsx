"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  Search,
  Users,
  User,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  Plus,
  CheckCircle,
  Loader2,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { authService } from "@/lib/services/auth-service";
import { attendanceService } from "@/lib/services/attendance-service";
import { classService } from "@/lib/services/class-service";
import { gradeService } from "@/lib/services/grade-service";
import { progressService } from "@/lib/services/progress-service";
import type { AttendanceRecordDto } from "@/lib/types/attendance-api";
import type { UserProfile } from "@/lib/auth/backend-api";
import type { ClassSummary } from "@/lib/types/class-api";
import {
  classCardGradient,
  classStatusLabel,
  formatClassSemester,
  parseSemesterFilter,
} from "@/lib/class-display";
import { CreateClassDialog } from "./CreateClassDialog";
import { ClassStudentsDialog } from "./ClassStudentsDialog";
import { ClassCommentsDialog } from "./ClassCommentsDialog";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import {
  QueryKey,
  semesterFromParam,
  semesterToParam,
} from "@/lib/navigation/app-query";
import { cn } from "@/lib/utils";
import { CLASSES_UPDATED_EVENT } from "@/components/notifications/notification-context";

type UserRole = "student" | "teacher" | "admin";

interface DisplayClass {
  summary: ClassSummary;
  iconBg: string;
  description: string;
  statusLabel: ReturnType<typeof classStatusLabel>;
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
  const selectedSemester = semesterFromParam(get(QueryKey.semester));

  const setSelectedSemester = useCallback(
    (label: string) => {
      setParams({ [QueryKey.semester]: semesterToParam(label) });
    },
    [setParams]
  );

  const [role, setRole] = useState<UserRole>("student");
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [classes, setClasses] = useState<DisplayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [commentsClass, setCommentsClass] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [activeModal, setActiveModal] = useState<{
    type: "attendance" | "grades";
    classId: number;
    className: string;
  } | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecordDto[]>(
    []
  );
  const [classGrade, setClassGrade] = useState<{
    numeric: number;
    letter: string;
  } | null>(null);

  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isStudent = role === "student";
  const canManageClasses = isAdmin;
  const canViewRoster = isTeacher || isAdmin;

  useEffect(() => {
    async function fetchRole() {
      try {
        const response = await authService.me();
        const user = response?.data as UserProfile | undefined;
        if (user?.role) {
          setRole(user.role.toLowerCase() as UserRole);
        }
        if (user?.userId) {
          setStudentId(user.userId);
        }
      } catch {
        /* default */
      } finally {
        setRoleLoaded(true);
      }
    }
    void fetchRole();
  }, []);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const semesterFilter = parseSemesterFilter(selectedSemester);
      const page = await classService.listClasses({
        search: searchQuery.trim() || undefined,
        semester: semesterFilter.semester,
        academicYear: semesterFilter.academicYear,
        size: 50,
      });

      const items = page.items ?? [];
      const withMeta: DisplayClass[] = await Promise.all(
        items.map(async (summary, index) => {
          let description = "";
          try {
            const detail = await classService.getClass(summary.id);
            description = detail.description?.trim() ?? "";
          } catch {
            description = "";
          }
          return {
            summary,
            iconBg: classCardGradient(index),
            description:
              description ||
              [formatClassSemester(summary)]
                .filter(Boolean)
                .join(" · ") ||
              "Open this class to view lessons and materials.",
            statusLabel: classStatusLabel(summary.status),
            semesterLabel: formatClassSemester(summary),
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
  }, [searchQuery, selectedSemester, isStudent]);

  useEffect(() => {
    if (!roleLoaded) return;
    void loadClasses();
  }, [roleLoaded, loadClasses]);

  useEffect(() => {
    const onClassesUpdated = () => void loadClasses();
    window.addEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
    return () => window.removeEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
  }, [loadClasses]);

  useEffect(() => {
    if (!activeModal || !studentId) {
      setAttendanceRate(null);
      setRecentAttendance([]);
      setClassGrade(null);
      return;
    }
    let cancelled = false;
    const modal = activeModal;
    const sid = studentId;
    async function loadModalData() {
      setModalLoading(true);
      try {
        if (modal.type === "attendance") {
          const [stats, records] = await Promise.all([
            attendanceService.getStatistics({
              classId: modal.classId,
              studentId: sid,
            }),
            attendanceService.getStudentAttendance(sid, modal.classId),
          ]);
          if (!cancelled) {
            setAttendanceRate(stats.attendanceRate);
            setRecentAttendance(records.slice(0, 5));
          }
        } else {
          try {
            const finalGrade = await gradeService.calculateFinalGrade(
              modal.classId,
              sid
            );
            if (!cancelled) {
              setClassGrade({
                numeric: Number(finalGrade.numericGrade),
                letter: finalGrade.letterGrade,
              });
            }
          } catch {
            const progress = await progressService.getClassProgress(
              sid,
              modal.classId
            );
            if (!cancelled && progress.numericGrade != null && progress.letterGrade) {
              setClassGrade({
                numeric: Number(progress.numericGrade),
                letter: progress.letterGrade,
              });
            } else if (!cancelled) {
              setClassGrade(null);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setAttendanceRate(null);
          setRecentAttendance([]);
          setClassGrade(null);
        }
      } finally {
        if (!cancelled) setModalLoading(false);
      }
    }
    void loadModalData();
    return () => {
      cancelled = true;
    };
  }, [activeModal, studentId]);

  const filteredClasses = useMemo(() => {
    if (selectedSemester === "All Semesters") return classes;
    return classes.filter((c) => c.semesterLabel === selectedSemester);
  }, [classes, selectedSemester]);

  const headerBadge = isStudent
    ? "Enrolled"
    : isTeacher
      ? "Teaching"
      : "All";

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {isStudent ? "My Classes" : isTeacher ? "My Classes" : "All Classes"}
            <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-0 text-[10px] font-bold">
              {headerBadge}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isStudent
              ? "Classes you join after accepting a teacher's invitation."
              : isTeacher
                ? "Classes you teach — open the roster to invite students."
                : "Create classes, assign teachers, and invite students."}
          </p>
        </div>

        {canManageClasses && (
          <Button
            size="sm"
            variant="inverse"
            className="gap-1.5 font-bold h-8.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Class
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by class name, code, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-slate-50/50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800"
              />
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="h-9.5 px-3 py-1 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-auto"
            >
              <option value="All Semesters">All Semesters</option>
              <option value="Semester 1, 2026">Semester 1, 2026</option>
              <option value="Semester 2, 2026">Semester 2, 2026</option>
            </select>
        </div>

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

        {!loading && !loadError && filteredClasses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map(({ summary: cls, iconBg, description, statusLabel, semesterLabel }) => (
              <Card
                key={cls.id}
                className="group border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700/80 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div
                  className={`h-24 bg-gradient-to-br ${iconBg} relative overflow-hidden flex items-center justify-center`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <BookOpen className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge
                      className={
                        statusLabel === "Active"
                          ? "bg-emerald-500 text-white font-bold"
                          : "bg-amber-500 text-white font-bold"
                      }
                    >
                      {statusLabel}
                    </Badge>
                    <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {cls.code}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white text-center px-4 leading-tight drop-shadow-md">
                    {cls.name}
                  </h3>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col gap-3">
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
                  <p className="text-xs text-muted-foreground/90 leading-relaxed flex-1">
                    {description}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() =>
                      onEnterClass?.({
                        classId: String(cls.id),
                        title: cls.name,
                        module: semesterLabel,
                      })
                    }
                    size="sm"
                    variant="inverse"
                    className="flex-1 min-w-[120px] text-xs font-bold h-9"
                  >
                    Enter Class
                  </Button>

                  {(isStudent || isTeacher || isAdmin) && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      title="Class comments"
                      onClick={() =>
                        setCommentsClass({ id: cls.id, name: cls.name })
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}

                  {canViewRoster && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      title="Manage students"
                      onClick={() =>
                        setRosterClass({ id: cls.id, name: cls.name })
                      }
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}

                  {isStudent && (
                    <>
                      <Button
                        onClick={() =>
                          setActiveModal({
                            type: "attendance",
                            classId: cls.id,
                            className: cls.name,
                          })
                        }
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="Attendance"
                      >
                        <CalendarCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() =>
                          setActiveModal({
                            type: "grades",
                            classId: cls.id,
                            className: cls.name,
                          })
                        }
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="Grades"
                      >
                        <GraduationCap className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && !loadError && filteredClasses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="p-4 bg-slate-100 dark:bg-zinc-800/50 rounded-full">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">No Classes Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {isStudent
                  ? "You have no classes yet. Accept an invitation from your teacher in the notification bell."
                  : isTeacher
                    ? "You have no classes yet. An administrator can create a class and assign you as the teacher."
                    : canManageClasses
                      ? "Create a class and enroll students to get started."
                      : "No classes matched your filters."}
              </p>
            </div>
          )}
      </div>

      <CreateClassDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadClasses()}
      />

      <ClassStudentsDialog
        open={rosterClass !== null}
        onOpenChange={(open) => !open && setRosterClass(null)}
        classId={rosterClass?.id ?? null}
        className={rosterClass?.name ?? ""}
        canManage={canViewRoster}
      />

      <ClassCommentsDialog
        open={commentsClass !== null}
        onOpenChange={(open) => !open && setCommentsClass(null)}
        classId={commentsClass?.id ?? 0}
        className={commentsClass?.name ?? ""}
        canPost={isStudent || isTeacher || isAdmin}
      />

      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-500" />
              {activeModal?.type === "attendance" && "Attendance Registry"}
              {activeModal?.type === "grades" && "Academic Performance"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time student registry data for {activeModal?.className}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {modalLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!modalLoading && activeModal?.type === "attendance" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Overall Attendance Rate
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-bold text-xs">
                    {attendanceRate != null ? `${attendanceRate}%` : "—"}
                  </Badge>
                </div>
                {recentAttendance.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No attendance records for this class yet.
                  </p>
                ) : (
                  recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center text-xs px-1"
                    >
                      <span className="text-muted-foreground font-medium">
                        {record.sessionDate}
                      </span>
                      <span
                        className={cn(
                          "font-bold flex items-center gap-1",
                          record.status === "PRESENT"
                            ? "text-emerald-500"
                            : record.status === "LATE"
                              ? "text-amber-500"
                              : "text-red-500"
                        )}
                      >
                        {record.status === "PRESENT" && (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {record.status === "PRESENT"
                          ? "Present"
                          : record.status === "LATE"
                            ? "Late"
                            : "Absent"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            {!modalLoading && activeModal?.type === "grades" &&
              (classGrade ? (
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Current Grade
                  </span>
                  <Badge className="bg-indigo-500/10 text-indigo-500 border-0 font-bold text-xs">
                    {classGrade.letter} ({classGrade.numeric.toFixed(1)}%)
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No grade recorded for this class yet.
                </p>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
