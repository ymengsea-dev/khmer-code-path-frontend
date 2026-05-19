"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Course } from "@/types/course";
import { CourseCard } from "./CourseCard";
import { CourseBreakdown } from "./CourseBreakdown";
import {
  TrendingUp,
  CheckCircle,
  Video,
  Users,
  BookOpen,
  AlertCircle,
  Zap,
  Activity,
  Building2,
  GraduationCap,
  ClipboardList,
  Loader2,
  Sparkles,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseService } from "@/lib/services/course-service";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { authService } from "@/lib/services/auth-service";
import { dashboardService } from "@/lib/services/dashboard-service";
import type { UserProfile } from "@/lib/auth/backend-api";
import type {
  AdminDashboard,
  StudentDashboard,
  TeacherDashboard,
} from "@/lib/types/dashboard-api";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth/use-user-role";

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
}

type StatCard = {
  label: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  positive: boolean;
};

function CourseCatalogSection({
  title,
  courses,
  coursesLoading,
  coursesError,
  selectedId,
  onSelect,
  canManageCourses,
  onCreateCourse,
  onEditCourse,
  onCoursesChanged,
}: {
  title: string;
  courses: Course[];
  coursesLoading?: boolean;
  coursesError?: string | null;
  selectedId?: number;
  onSelect: (course: Course) => void;
  canManageCourses?: boolean;
  onCreateCourse?: () => void;
  onEditCourse?: (course: Course) => void;
  onCoursesChanged?: () => void;
}) {
  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await courseService.deleteCourse(course.id);
      onCoursesChanged?.();
    } catch {
      alert("Could not delete course.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h2 className="text-md font-extrabold text-foreground tracking-tight uppercase text-zinc-700 dark:text-zinc-300">
          {title}
        </h2>
        {canManageCourses && onCreateCourse && (
          <Button size="sm" onClick={onCreateCourse}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add course
          </Button>
        )}
      </div>
      {coursesError && (
        <p className="text-sm text-destructive" role="alert">
          {coursesError}
        </p>
      )}
      {coursesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
          No courses yet.
          {canManageCourses ? " Create your first course to get started." : ""}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {courses.map((course) => (
            <div key={course.id} className="relative group">
              <CourseCard
                course={course}
                selected={selectedId === course.id}
                onClick={() => onSelect(course)}
              />
              {canManageCourses && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditCourse && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCourse(course);
                      }}
                      aria-label={`Edit ${course.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-md text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(course);
                    }}
                    aria-label={`Delete ${course.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
}: CourseGridProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(
    session?.user?.name ?? null
  );
  const [statsLoading, setStatsLoading] = useState(true);
  const [studentDash, setStudentDash] = useState<StudentDashboard | null>(null);
  const [teacherDash, setTeacherDash] = useState<TeacherDashboard | null>(null);
  const [adminDash, setAdminDash] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    async function loadProfileAndDashboard() {
      setStatsLoading(true);

      let resolvedRole = session?.user?.role as UserRole | undefined;
      let name = session?.user?.name?.trim() || null;

      if (!resolvedRole) {
        try {
          const response = await authService.me();
          const user = response?.data as UserProfile | undefined;
          if (user?.role) {
            resolvedRole = user.role.toLowerCase() as UserRole;
          }
          const userName = user?.userName?.trim();
          if (userName) {
            name = userName;
          }
        } catch (err) {
          console.error("Failed to load user profile", err);
        }
      }

      if (cancelled) {
        return;
      }

      if (name) {
        setDisplayName(name);
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
  }, [session?.user?.role, session?.user?.name, sessionStatus]);

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

  return (
    <div className="h-full w-full flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Welcome Back
            {displayName ? (
              <>
                ,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  {displayName}
                </span>
              </>
            ) : (
              <span className="ml-1 inline-block h-6 w-24 animate-pulse rounded bg-muted align-middle" aria-hidden />
            )}
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-bold shadow-xs hover:bg-emerald-500/20 active:translate-y-px transition-all">
            <Video className="w-3.5 h-3.5" />
            <span>Join Live Class</span>
          </button>
          <NotificationBell />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 gap-6 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {statsLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            statCards.map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between h-28 relative overflow-hidden group hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
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
                        : "bg-amber-500/10 text-amber-500"
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
                      stat.positive ? "text-emerald-500" : "text-amber-500"
                    )}
                  >
                    {stat.trend}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {role === "student" && (
          <>
            <CourseBreakdown />
            <CourseCatalogSection
              title="Continue Learning"
              courses={courses}
              coursesLoading={coursesLoading}
              coursesError={coursesError}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </>
        )}

        {role === "teacher" && teacherDash && (
          <div className="flex flex-col gap-4">
            <h2 className="text-md font-extrabold text-foreground tracking-tight uppercase text-zinc-700 dark:text-zinc-300">
              Recent Student Questions
            </h2>
            {teacherDash.recentQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                No student questions yet. Students can post comments from the
                Classes page.
              </p>
            ) : (
              <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80">
                {teacherDash.recentQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
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

        {(role === "admin" || role === "teacher") && canManageCourses && (
          <CourseCatalogSection
            title={role === "admin" ? "Course catalog" : "Your courses"}
            courses={courses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
            selectedId={selectedId}
            onSelect={onSelect}
            canManageCourses={canManageCourses}
            onCreateCourse={onCreateCourse}
            onEditCourse={onEditCourse}
            onCoursesChanged={onCoursesChanged}
          />
        )}
      </div>
    </div>
  );
}
