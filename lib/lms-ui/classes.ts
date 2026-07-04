import type {
  ClassStatus,
  ClassVisibility,
  GradingWeightKey,
} from "@/lib/types/class-api";

export const CLASSES_UI = {
  allSemestersLabel: "All Semesters",
  cardGradients: [
    "from-indigo-500 to-purple-600",
    "from-blue-600 to-sky-700",
    "from-emerald-600 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-600 to-fuchsia-700",
  ],
  lessonTabs: [
    { id: "content", label: "Lessons" },
    { id: "materials", label: "Materials" },
    { id: "ai", label: "AI" },
    { id: "comments", label: "Comments" },
  ],
  settingsTabs: [
    { id: "general", label: "General" },
    { id: "grading", label: "Score breakdown" },
    { id: "students", label: "Students" },
    { id: "lessons", label: "Lessons" },
    { id: "quizzes", label: "Quizzes" },
  ],
  scoreComponents: [
    { key: "attendance" as GradingWeightKey, label: "Attendance", color: "emerald" },
    { key: "assignment" as GradingWeightKey, label: "Assignment", color: "blue" },
    { key: "quiz" as GradingWeightKey, label: "Quiz", color: "violet" },
    { key: "midterm" as GradingWeightKey, label: "Mid-term", color: "amber" },
    { key: "finalExam" as GradingWeightKey, label: "Final", color: "rose" },
  ],
  statusOptions: [
    { value: "ACTIVE" as ClassStatus, label: "Active" },
    { value: "DRAFT" as ClassStatus, label: "Draft" },
    { value: "ARCHIVED" as ClassStatus, label: "Archived" },
  ],
  visibilityOptions: [
    {
      value: "PRIVATE" as ClassVisibility,
      label: "Private (invite only)",
      description: "Students can join only after you invite them.",
    },
    {
      value: "PUBLIC" as ClassVisibility,
      label: "Public (self-enroll)",
      description:
        "Students at your school can discover and join this class from Public Courses.",
    },
  ],
  publicCoursesDisabledHint:
    "Your school administrator has not enabled public courses. Only private (invite-only) classes are available.",
} as const;

export const PUBLIC_COURSES_UI = {
  pageTitle: "Public Courses",
  pageDescription: "Browse open classes at your school and join instantly.",
  navLabel: "Public Courses",
  emptyMessage: "No public courses are available right now.",
  enrollButtonLabel: "Join class",
  enrolledLabel: "Enrolled",
  searchPlaceholder: "Search public courses…",
} as const;

export function visibilityOptionsForClass(
  allowedValues: ClassVisibility[] | undefined,
  publicCoursesEnabled: boolean,
) {
  const allowed = new Set(
    allowedValues ??
      (publicCoursesEnabled ? ["PRIVATE", "PUBLIC"] : ["PRIVATE"]),
  );
  return CLASSES_UI.visibilityOptions.filter((o) => allowed.has(o.value));
}
