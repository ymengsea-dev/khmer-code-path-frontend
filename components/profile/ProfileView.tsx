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
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { profileSummaryService } from "@/lib/services/profile-summary-service";
import type { AdminDashboard, StudentDashboard, TeacherDashboard } from "@/lib/types/dashboard-api";
import type { ComponentType } from "react";

const GLASS: React.CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color)",
  boxShadow: "var(--glass-shadow)",
};

const GLASS_SUBTLE: React.CSSProperties = {
  background: "var(--glass-bg-subtle)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color-subtle)",
  boxShadow: "var(--glass-shadow-subtle)",
};

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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/8">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, #305FC9 0%, #7c3aed 100%)",
        }}
      />
    </div>
  );
}

function numberText(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(value);
}

function percentText(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
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
      { label: "Active Classes",     value: numberText(teacherDashboard?.activeClasses),    helper: "Classes you manage",        icon: Users        },
      { label: "Published Quizzes",  value: numberText(teacherDashboard?.quizzes),          helper: "Created for students",      icon: ClipboardList },
      { label: "Student Questions",  value: numberText(teacherDashboard?.studentQuestions), helper: "Recent class discussions",  icon: BookOpen     },
      { label: "Notebook Notes",     value: numberText(noteCount),                          helper: "Saved teaching notes",      icon: FileText     },
    ];
  }
  if (role === "admin") {
    return [
      { label: "Students",    value: numberText(adminDashboard?.totalStudents),    helper: "Registered learners",  icon: GraduationCap },
      { label: "Teachers",    value: numberText(adminDashboard?.totalInstructors), helper: "Active instructors",   icon: Users         },
      { label: "Classes",     value: numberText(adminDashboard?.totalClasses),     helper: "Across the LMS",       icon: BookOpen      },
      { label: "Departments", value: numberText(adminDashboard?.totalDepartments), helper: "Academic groups",      icon: ShieldCheck   },
    ];
  }
  return [
    { label: "Enrolled Classes",  value: numberText(studentDashboard?.coursesEnrolled),  helper: "Current learning load",       icon: BookOpen     },
    { label: "Completed Classes", value: numberText(studentDashboard?.coursesCompleted), helper: "Finished learning",           icon: CheckCircle2 },
    { label: "Quizzes Done",      value: numberText(studentDashboard?.quizzesCompleted), helper: `${quizCount} assigned total`, icon: ClipboardList },
    { label: "Attendance",        value: percentText(studentDashboard?.attendanceRate),  helper: "Overall attendance rate",     icon: Trophy       },
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
      { title: "Class Builder",   description: `${teacherDashboard?.activeClasses ?? 0} active classes`,    earned: (teacherDashboard?.activeClasses ?? 0) > 0,     icon: BookOpen     },
      { title: "Quiz Creator",    description: `${teacherDashboard?.quizzes ?? 0} published quizzes`,       earned: (teacherDashboard?.quizzes ?? 0) > 0,           icon: ClipboardList },
      { title: "Student Mentor",  description: `${teacherDashboard?.studentQuestions ?? 0} student Qs`,     earned: (teacherDashboard?.studentQuestions ?? 0) > 0,  icon: Users        },
    ];
  }
  if (role === "admin") {
    return [
      { title: "LMS Operator",       description: `${adminDashboard?.totalClasses ?? 0} classes managed`,       earned: (adminDashboard?.totalClasses ?? 0) > 0,       icon: ShieldCheck  },
      { title: "People Manager",     description: `${adminDashboard?.totalStudents ?? 0} students registered`,  earned: (adminDashboard?.totalStudents ?? 0) > 0,      icon: Users        },
      { title: "Academic Structure", description: `${adminDashboard?.totalDepartments ?? 0} departments`,       earned: (adminDashboard?.totalDepartments ?? 0) > 0,   icon: GraduationCap},
    ];
  }
  return [
    { title: "Active Learner",     description: `${studentDashboard?.coursesEnrolled ?? 0} enrolled`,  earned: (studentDashboard?.coursesEnrolled ?? 0) > 0, icon: BookOpen     },
    { title: "Quiz Finisher",      description: `${submittedQuizCount} submitted`,                     earned: submittedQuizCount > 0,                       icon: ClipboardList },
    { title: "Notebook Builder",   description: `${noteCount} saved notes`,                            earned: noteCount > 0,                                icon: FileText     },
    { title: "Favorite Collector", description: `${favoriteNoteCount} favorites`,                      earned: favoriteNoteCount > 0,                        icon: Star         },
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
  const bio = (currentUser as { bio?: string | null } | null | undefined)?.bio;

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
        favoriteNoteCount: data?.notes.items.filter((n) => n.favorite).length ?? 0,
        submittedQuizCount:
          data?.quizzes.filter((q) => q.submissionStatus === "SUBMITTED").length ?? 0,
      }),
    [data, role]
  );

  const averageGrade =
    data?.gradeRows.length
      ? Math.round(
          data.gradeRows.reduce((s, r) => s + (r.numericGrade ?? 0), 0) / data.gradeRows.length
        )
      : null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-5 px-0 py-0 pb-6">

        {/* ── Hero card ── */}
        <div className="rounded-2xl p-5 sm:p-6" style={GLASS}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, #305FC9 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 16px rgba(48,95,201,0.35)",
                }}
              >
                {initials}
              </div>

              <div className="space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                  {displayName || "Unknown User"}
                </h2>
                {email ? <p className="text-sm text-muted-foreground truncate">{email}</p> : null}
                {bio ? <p className="text-xs text-muted-foreground line-clamp-3">{bio}</p> : null}
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(217,119,6,0.10)", color: "#d97706" }}
                >
                  <Medal className="w-3.5 h-3.5" />
                  {roleLabel}
                </div>
              </div>
            </div>

            {averageGrade != null && (
              <div className="rounded-2xl px-5 py-4 shrink-0 min-w-36" style={GLASS_SUBTLE}>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Avg Grade</p>
                <p
                  className="text-3xl font-black mt-0.5"
                  style={{ color: "#305FC9" }}
                >
                  {averageGrade}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={averageGrade} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive px-1">Could not load profile activity.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">

            {/* Left column */}
            <div className="space-y-5">

              {/* Metric cards */}
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl p-4 flex items-center gap-3" style={GLASS}>
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(48,95,201,0.10)", color: "#305FC9" }}
                    >
                      <metric.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{metric.label}</p>
                      <p className="text-xl font-black text-foreground leading-tight">{metric.value}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{metric.helper}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="rounded-2xl p-5" style={GLASS}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Achievements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((a) => (
                    <div
                      key={a.title}
                      className="flex items-center gap-3 rounded-xl px-3 py-3"
                      style={GLASS_SUBTLE}
                    >
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{
                          background: a.earned
                            ? "linear-gradient(135deg, #305FC9 0%, #7c3aed 100%)"
                            : "rgba(0,0,0,0.08)",
                          color: a.earned ? "white" : "rgba(0,0,0,0.3)",
                        }}
                      >
                        <a.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                      {a.earned && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Class grades (student only) */}
              {role === "student" && (
                <div className="rounded-2xl p-5" style={GLASS}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Class Grades</h3>
                  {data?.gradeRows.length ? (
                    <div className="space-y-3">
                      {data.gradeRows.map((grade) => (
                        <div key={grade.classId} className="rounded-xl px-3 py-3" style={GLASS_SUBTLE}>
                          <div className="flex items-center justify-between text-sm font-semibold mb-2">
                            <span className="truncate">{grade.course}</span>
                            <span className="shrink-0 ml-2" style={{ color: "#305FC9" }}>{grade.grade}</span>
                          </div>
                          <ProgressBar value={grade.numericGrade ?? 0} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No grades posted yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Recent notes */}
              <div className="rounded-2xl p-5" style={GLASS}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notebook Activity</h3>
                {data?.notes.items.length ? (
                  <div className="space-y-2">
                    {data.notes.items.slice(0, 5).map((note) => (
                      <div key={note.id} className="rounded-xl px-3 py-2.5" style={GLASS_SUBTLE}>
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {note.preview || note.sourceLabel || "No preview"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notebook notes yet.</p>
                )}
              </div>

              {/* Learning activity (student only) */}
              {role === "student" && (
                <div className="rounded-2xl p-5" style={GLASS}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Learning Activity</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Enrolled classes",  value: data?.classes.length ?? 0 },
                      { label: "Assigned quizzes",  value: data?.quizzes.length ?? 0 },
                      { label: "Submitted quizzes", value: data?.quizzes.filter((q) => q.submissionStatus === "SUBMITTED").length ?? 0 },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl px-3 py-2" style={GLASS_SUBTLE}>
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-bold text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
