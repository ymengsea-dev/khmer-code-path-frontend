"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Course } from "@/types/course";
import { CourseBreakdown } from "./CourseBreakdown";
import {
  TrendingUp,
  CheckCircle,
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/lib/services/dashboard-service";
import type {
  AdminDashboard,
  StudentDashboard,
  TeacherDashboard,
} from "@/lib/types/dashboard-api";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth/use-user-role";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { classService } from "@/lib/services/class-service";
import type { ClassSummary } from "@/lib/types/class-api";
import {
  BouncyLoadingCard,
  BouncyStagger,
  BouncyStaggerItem,
} from "@/components/motion";

interface CourseGridProps {
  courses: Course[];
  coursesLoading?: boolean;
  coursesError?: string | null;
  selectedId?: number;
  onSelect: (course: Course) => void;
  canManageCourses?: boolean;
  onCreateCourse?: () => void;
  onEditCourse?: (course: Course) => void;
  onCoursesChanged?: () => void;
  onEnterClass?: (payload: {
    classId: string;
    title: string;
    module: string;
  }) => void;
  onViewClassDetail?: (payload: { classId: string }) => void;
}

type StatCard = {
  label: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  positive: boolean;
};

export function CourseGrid({
  courses,
  coursesLoading,
  coursesError,
  selectedId,
  onSelect,
  canManageCourses,
  onCreateCourse,
  onEditCourse,
  onCoursesChanged,
  onEnterClass,
  onViewClassDetail,
}: CourseGridProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { data: currentUser } = useCurrentUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [studentDash, setStudentDash] = useState<StudentDashboard | null>(null);
  const [teacherDash, setTeacherDash] = useState<TeacherDashboard | null>(null);
  const [adminDash, setAdminDash] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    async function loadProfileAndDashboard() {
      setStatsLoading(true);

      const resolvedRole =
        (currentUser?.role?.toLowerCase() as UserRole | undefined) ??
        (session?.user?.role?.toLowerCase() as UserRole | undefined);

      if (cancelled) {
        return;
      }

      if (!resolvedRole) {
        setStatsLoading(false);
        return;
      }

      setRole(resolvedRole);

      try {
        if (resolvedRole === "student") {
          setStudentDash(await dashboardService.getStudentDashboard());
        } else if (resolvedRole === "teacher") {
          setTeacherDash(await dashboardService.getTeacherDashboard());
        } else if (resolvedRole === "admin") {
          setAdminDash(await dashboardService.getAdminDashboard());
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    void loadProfileAndDashboard();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, session?.user?.role, sessionStatus]);

  const studentStats: StatCard[] = useMemo(() => {
    if (!studentDash) return [];
    const gpa =
      studentDash.overallGpa != null
        ? Number(studentDash.overallGpa).toFixed(2)
        : "—";
    return [
      {
        label: "Overall GPA",
        value: gpa,
        trend:
          studentDash.coursesEnrolled > 0
            ? `${studentDash.coursesEnrolled} enrolled`
            : "No enrollments yet",
        icon: TrendingUp,
        positive: true,
      },
      {
        label: "Courses Completed",
        value: String(studentDash.coursesCompleted),
        trend: `of ${studentDash.coursesEnrolled} enrolled`,
        icon: BookOpen,
        positive: true,
      },
      {
        label: "Quizzes Completed",
        value: String(studentDash.quizzesCompleted),
        trend: "Across all classes",
        icon: ClipboardList,
        positive: true,
      },
      {
        label: "Attendance",
        value: `${studentDash.attendanceRate}%`,
        trend: "Overall rate",
        icon: CheckCircle,
        positive: studentDash.attendanceRate >= 80,
      },
    ];
  }, [studentDash]);

  const teacherStats: StatCard[] = useMemo(() => {
    if (!teacherDash) return [];
    return [
      {
        label: "Active Classes",
        value: String(teacherDash.activeClasses),
        trend: "Currently teaching",
        icon: BookOpen,
        positive: true,
      },
      {
        label: "Quizzes",
        value: String(teacherDash.quizzes),
        trend: "Published in your classes",
        icon: ClipboardList,
        positive: true,
      },
      {
        label: "Students",
        value: String(teacherDash.students),
        trend: "Enrolled across classes",
        icon: Users,
        positive: true,
      },
      {
        label: "Student Questions",
        value: String(teacherDash.studentQuestions),
        trend: "Class discussion comments",
        icon: MessageSquare,
        positive: teacherDash.studentQuestions === 0,
      },
    ];
  }, [teacherDash]);

  const adminStats: StatCard[] = useMemo(() => {
    if (!adminDash) return [];
    return [
      {
        label: "Total Students",
        value: String(adminDash.totalStudents),
        trend: "Active accounts",
        icon: Users,
        positive: true,
      },
      {
        label: "Total Instructors",
        value: String(adminDash.totalInstructors),
        trend: "Teaching staff",
        icon: GraduationCap,
        positive: true,
      },
      {
        label: "Total Departments",
        value: String(adminDash.totalDepartments),
        trend: "Academic units",
        icon: Building2,
        positive: true,
      },
      {
        label: "Total Classes",
        value: String(adminDash.totalClasses),
        trend: "Institution-wide",
        icon: BookOpen,
        positive: true,
      },
    ];
  }, [adminDash]);

  const statCards =
    role === "student"
      ? studentStats
      : role === "teacher"
        ? teacherStats
        : adminStats;

  const canSeeClassSection =
    role === "student" || role === "teacher" || role === "admin";
  const {
    data: classPage,
    isLoading: classesLoading,
    isError: classesIsError,
  } = useQuery({
    queryKey: ["dashboard", "classes", role],
    queryFn: () => classService.listClasses({ size: 50 }),
    enabled: canSeeClassSection,
    staleTime: 60_000,
  });
  const classItems = classPage?.items ?? [];

  return (
    <div className="h-full w-full flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto gap-6 flex flex-col">
        <BouncyStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {statsLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <BouncyStaggerItem key={i}>
                  <BouncyLoadingCard className="h-28" />
                </BouncyStaggerItem>
              ))}
            </>
          ) : (
            statCards.map((stat, i) => (
              <BouncyStaggerItem key={i}>
                <div
                  className="p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden transition-all"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border-color)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-muted-foreground font-semibold">
                      {stat.label}
                    </span>
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        stat.positive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-foreground tracking-tight">
                      {stat.value}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-bold flex items-center gap-1",
                        stat.positive ? "text-emerald-500" : "text-amber-500",
                      )}
                    >
                      {stat.trend}
                    </div>
                  </div>
                </div>
              </BouncyStaggerItem>
            ))
          )}
        </BouncyStagger>

        {role === "student" && <CourseBreakdown />}

        {role === "teacher" && teacherDash && (
          <div className="flex flex-col gap-4">
            <h2 className="text-md font-extrabold text-foreground tracking-tight uppercase dark:text-zinc-300">
              Recent Student Questions
            </h2>
            {teacherDash.recentQuestions.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-6 text-center border border-dashed border-white/60 rounded-xl"
                style={{ background: "var(--glass-bg-subtle)" }}
              >
                No student questions yet. Students can post comments from the
                Classes page.
              </p>
            ) : (
              <div
                className="rounded-2xl overflow-hidden divide-y divide-black/5"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {teacherDash.recentQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="px-5 py-4 hover:bg-black/2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {q.authorName}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {q.className}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {q.body}
                        </p>
                      </div>
                      <MessageSquare className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {canSeeClassSection && (
          <div className="flex flex-col gap-4">
            <h2 className="text-md font-extrabold text-foreground tracking-tight uppercase dark:text-zinc-300">
              Classes
            </h2>
            {classesLoading ? (
              <BouncyStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BouncyStaggerItem key={i}>
                    <BouncyLoadingCard className="min-h-40" />
                  </BouncyStaggerItem>
                ))}
              </BouncyStagger>
            ) : classesIsError ? (
              <p className="text-sm text-destructive" role="alert">
                Failed to load classes.
              </p>
            ) : classItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                No classes available.
              </p>
            ) : (
              <>
                <BouncyStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {classItems.map((klass: ClassSummary) => (
                  <BouncyStaggerItem key={klass.id} enter="simple">
                  <Card
                    bouncy={false}
                    className="flex flex-col overflow-hidden"
                        style={{
                          background: "var(--glass-bg)",
                          backdropFilter: "var(--glass-blur)",
                          WebkitBackdropFilter: "var(--glass-blur)",
                          border: "1px solid var(--glass-border-color)",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        }}
                      >
                        <div
                          className={`h-24 bg-linear-to-br ${klass.cardGradient} relative overflow-hidden flex items-center justify-center`}
                        >
                          <div className="absolute inset-0 bg-black/10" />
                          <BookOpen className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <Badge
                              className={
                                klass.status === "ACTIVE"
                                  ? "bg-emerald-500 text-white font-bold"
                                  : "bg-amber-500 text-white font-bold"
                              }
                            >
                              {klass.statusLabel}
                            </Badge>
                            <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md">
                              {klass.code}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-white text-center px-4 leading-tight drop-shadow-md">
                            {klass.name}
                          </h3>
                        </div>
                        <CardContent className="p-4 flex-1 flex flex-col gap-3">
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-emerald-500" />
                              {klass.enrolledCount} Students
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {klass.semesterLabel || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground/90 leading-relaxed">
                            Teacher: {klass.teacherName}
                          </p>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-xs mt-1"
                            onClick={() =>
                              onViewClassDetail
                                ? onViewClassDetail({ classId: String(klass.id) })
                                : onEnterClass?.({
                                    classId: String(klass.id),
                                    title: klass.name,
                                    module: klass.semesterLabel ?? "",
                                  })
                            }
                          >
                            View class detail
                          </Button>
                        </CardContent>
                      </Card>
                    </BouncyStaggerItem>
                  ))}
                </BouncyStagger>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
