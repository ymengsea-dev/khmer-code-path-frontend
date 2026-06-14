"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  Medal,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { getRoleLabel, getUserInitials } from "@/lib/auth/user-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { profileSummaryService } from "@/lib/services/profile-summary-service";
import type { AdminDashboard, StudentDashboard, TeacherDashboard } from "@/lib/types/dashboard-api";
import type { ComponentType } from "react";

type Role = "student" | "teacher" | "admin";

interface ProfileMetric {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}

interface Achievement {
  title: string;
  description: string;
  earned: boolean;
  icon: ComponentType<{ className?: string }>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-linear-to-r from-violet-500 to-sky-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function numberText(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return String(value);
}

function percentText(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${Math.round(value)}%`;
}

function buildMetrics({
  role,
  studentDashboard,
  teacherDashboard,
  adminDashboard,
  noteCount,
  quizCount,
}: {
  role: Role;
  studentDashboard: StudentDashboard | null;
  teacherDashboard: TeacherDashboard | null;
  adminDashboard: AdminDashboard | null;
  noteCount: number;
  quizCount: number;
}): ProfileMetric[] {
  if (role === "teacher") {
    return [
      {
        label: "Active Classes",
        value: numberText(teacherDashboard?.activeClasses),
        helper: "Classes you manage",
        icon: Users,
      },
      {
        label: "Published Quizzes",
        value: numberText(teacherDashboard?.quizzes),
        helper: "Created for students",
        icon: ClipboardList,
      },
      {
        label: "Student Questions",
        value: numberText(teacherDashboard?.studentQuestions),
        helper: "Recent class discussions",
        icon: BookOpen,
      },
      {
        label: "Notebook Notes",
        value: numberText(noteCount),
        helper: "Saved teaching notes",
        icon: FileText,
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        label: "Students",
        value: numberText(adminDashboard?.totalStudents),
        helper: "Registered learners",
        icon: GraduationCap,
      },
      {
        label: "Teachers",
        value: numberText(adminDashboard?.totalInstructors),
        helper: "Active instructors",
        icon: Users,
      },
      {
        label: "Classes",
        value: numberText(adminDashboard?.totalClasses),
        helper: "Across the LMS",
        icon: BookOpen,
      },
      {
        label: "Departments",
        value: numberText(adminDashboard?.totalDepartments),
        helper: "Academic groups",
        icon: ShieldCheck,
      },
    ];
  }

  return [
    {
      label: "Enrolled Classes",
      value: numberText(studentDashboard?.coursesEnrolled),
      helper: "Current learning load",
      icon: BookOpen,
    },
    {
      label: "Completed Classes",
      value: numberText(studentDashboard?.coursesCompleted),
      helper: "Finished learning",
      icon: CheckCircle2,
    },
    {
      label: "Quizzes Completed",
      value: numberText(studentDashboard?.quizzesCompleted),
      helper: `${quizCount} assigned quiz${quizCount === 1 ? "" : "zes"}`,
      icon: ClipboardList,
    },
    {
      label: "Attendance",
      value: percentText(studentDashboard?.attendanceRate),
      helper: "Overall attendance rate",
      icon: Trophy,
    },
  ];
}

function buildAchievements({
  role,
  studentDashboard,
  teacherDashboard,
  adminDashboard,
  noteCount,
  favoriteNoteCount,
  submittedQuizCount,
}: {
  role: Role;
  studentDashboard: StudentDashboard | null;
  teacherDashboard: TeacherDashboard | null;
  adminDashboard: AdminDashboard | null;
  noteCount: number;
  favoriteNoteCount: number;
  submittedQuizCount: number;
}): Achievement[] {
  if (role === "teacher") {
    return [
      {
        title: "Class Builder",
        description: `${teacherDashboard?.activeClasses ?? 0} active classes`,
        earned: (teacherDashboard?.activeClasses ?? 0) > 0,
        icon: BookOpen,
      },
      {
        title: "Quiz Creator",
        description: `${teacherDashboard?.quizzes ?? 0} published quizzes`,
        earned: (teacherDashboard?.quizzes ?? 0) > 0,
        icon: ClipboardList,
      },
      {
        title: "Student Mentor",
        description: `${teacherDashboard?.studentQuestions ?? 0} student questions`,
        earned: (teacherDashboard?.studentQuestions ?? 0) > 0,
        icon: Users,
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        title: "LMS Operator",
        description: `${adminDashboard?.totalClasses ?? 0} classes managed`,
        earned: (adminDashboard?.totalClasses ?? 0) > 0,
        icon: ShieldCheck,
      },
      {
        title: "People Manager",
        description: `${adminDashboard?.totalStudents ?? 0} students registered`,
        earned: (adminDashboard?.totalStudents ?? 0) > 0,
        icon: Users,
      },
      {
        title: "Academic Structure",
        description: `${adminDashboard?.totalDepartments ?? 0} departments configured`,
        earned: (adminDashboard?.totalDepartments ?? 0) > 0,
        icon: GraduationCap,
      },
    ];
  }

  return [
    {
      title: "Active Learner",
      description: `${studentDashboard?.coursesEnrolled ?? 0} enrolled classes`,
      earned: (studentDashboard?.coursesEnrolled ?? 0) > 0,
      icon: BookOpen,
    },
    {
      title: "Quiz Finisher",
      description: `${submittedQuizCount} submitted quizzes`,
      earned: submittedQuizCount > 0,
      icon: ClipboardList,
    },
    {
      title: "Notebook Builder",
      description: `${noteCount} saved notes`,
      earned: noteCount > 0,
      icon: FileText,
    },
    {
      title: "Favorite Collector",
      description: `${favoriteNoteCount} favorite notes`,
      earned: favoriteNoteCount > 0,
      icon: Star,
    },
  ];
}

export function ProfileView() {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as Role | undefined) ?? "student";
  const displayName = currentUser?.userName?.trim() || session?.user?.name || "";
  const email = currentUser?.email || session?.user?.email || "";
  const roleLabel = getRoleLabel(currentUser?.role ?? session?.user?.role);
  const initials = getUserInitials(displayName || email || "?");
  const studentId = currentUser?.userId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-summary", role, studentId],
    enabled: Boolean(currentUser),
    queryFn: () => profileSummaryService.getProfileSummary(),
  });

  const metrics = useMemo(
    () =>
      buildMetrics({
        role,
        studentDashboard: data?.studentDashboard ?? null,
        teacherDashboard: data?.teacherDashboard ?? null,
        adminDashboard: data?.adminDashboard ?? null,
        noteCount: data?.notes.total ?? 0,
        quizCount: data?.quizzes.length ?? 0,
      }),
    [data, role]
  );

  const achievements = useMemo(
    () =>
      buildAchievements({
        role,
        studentDashboard: data?.studentDashboard ?? null,
        teacherDashboard: data?.teacherDashboard ?? null,
        adminDashboard: data?.adminDashboard ?? null,
        noteCount: data?.notes.total ?? 0,
        favoriteNoteCount: data?.notes.items.filter((note) => note.favorite).length ?? 0,
        submittedQuizCount:
          data?.quizzes.filter((quiz) => quiz.submissionStatus === "SUBMITTED").length ?? 0,
      }),
    [data, role]
  );

  const averageGrade =
    data?.gradeRows.length
      ? Math.round(
          data.gradeRows.reduce((sum, row) => sum + (row.numericGrade ?? 0), 0) /
            data.gradeRows.length
        )
      : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border shrink-0">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pt-5 space-y-5">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-linear-to-br from-sky-500 via-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-semibold text-white shadow-md">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      {displayName || "Unknown User"}
                    </h2>
                    {email ? <p className="text-sm text-muted-foreground">{email}</p> : null}
                    <Badge
                      variant="secondary"
                      className="gap-1.5 text-xs font-medium px-2.5 py-1 bg-amber-500/10 text-amber-600 border-amber-500/40"
                    >
                      <Medal className="w-3.5 h-3.5 text-amber-500" />
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
                {averageGrade != null ? (
                  <div className="rounded-xl border border-border/70 px-4 py-3 min-w-36">
                    <p className="text-xs text-muted-foreground">Average Grade</p>
                    <p className="text-2xl font-black text-foreground">{averageGrade}%</p>
                    <ProgressBar value={averageGrade} />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Could not load profile activity.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metrics.map((metric) => (
                    <Card key={metric.label} className="border-border/80 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                          <metric.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                          <p className="text-xl font-black text-foreground">{metric.value}</p>
                          <p className="text-[11px] text-muted-foreground">{metric.helper}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.title}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-3"
                      >
                        <div className="h-9 w-9 rounded-full bg-linear-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white">
                          <achievement.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.earned ? (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {role === "student" ? (
                  <Card className="border-border/80 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Class Grades</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {data?.gradeRows.length ? (
                        data.gradeRows.map((grade) => (
                          <div key={grade.classId} className="rounded-xl bg-muted/40 px-3 py-3">
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>{grade.course}</span>
                              <span>{grade.grade}</span>
                            </div>
                            <div className="mt-2">
                              <ProgressBar value={grade.numericGrade ?? 0} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No grades posted yet.</p>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-5">
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Recent Notebook Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {data?.notes.items.length ? (
                      data.notes.items.slice(0, 5).map((note) => (
                        <div key={note.id} className="rounded-xl border border-border/60 px-3 py-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {note.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {note.preview || note.sourceLabel || "No preview"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No notebook notes yet.</p>
                    )}
                  </CardContent>
                </Card>

                {role === "student" ? (
                  <Card className="border-border/80 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Learning Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Enrolled classes</span>
                        <span className="font-bold">{data?.classes.length ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assigned quizzes</span>
                        <span className="font-bold">{data?.quizzes.length ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted quizzes</span>
                        <span className="font-bold">
                          {data?.quizzes.filter((q) => q.submissionStatus === "SUBMITTED").length ??
                            0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
