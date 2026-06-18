/** URL query keys — single source of truth for shareable / refresh-safe state */

export const QueryKey = {
  view: "view",
  course: "course",
  lesson: "lesson",
  lessonId: "lessonId",
  module: "module",
  tab: "tab",
  q: "q",
  semester: "semester",
  note: "note",
  share: "share",
  thread: "thread",
  detail: "detail",
  lessonSource: "lessonSource",
  questions: "questions",
  userTab: "userTab",
  userStatus: "userStatus",
  userClass: "userClass",
  attendanceClass: "attendanceClass",
  attendanceMonth: "attendanceMonth",
  opsTab: "opsTab",
  contentModule: "contentModule",
  contentId: "contentId",
  contentTab: "contentTab",
  quizId: "quizId",
} as const;

export type AppView =
  | "courses"
  | "classes"
  | "lessons"
  | "tasks"
  | "notebook"
  | "ai-chat"
  | "code"
  | "learning"
  | "profile"
  | "settings"
  | "student-management"
  | "attendance-management"
  | "departments"
  | "operations"
  | "course-content"
  | "class-detail";

export type UserManagementTab =
  | "all"
  | "students"
  | "teachers"
  | "admins"
  | "permissions";

export type OperationsTab = "inventory" | "requests" | "infrastructure";

const VALID_OPS_TABS = new Set<string>(["inventory", "requests", "infrastructure"]);

export function parseOpsTab(value: string | null): OperationsTab {
  if (value && VALID_OPS_TABS.has(value)) {
    return value as OperationsTab;
  }
  return "inventory";
}

const VALID_VIEWS = new Set<string>([
  "courses",
  "classes",
  "lessons",
  "tasks",
  "notebook",
  "ai-chat",
  "code",
  "learning",
  "profile",
  "settings",
  "student-management",
  "attendance-management",
  "departments",
  "operations",
  "course-content",
  "class-detail",
]);

const VALID_USER_TABS = new Set<string>([
  "all",
  "students",
  "teachers",
  "admins",
  "permissions",
]);

export function parseUserTab(value: string | null): UserManagementTab {
  if (value && VALID_USER_TABS.has(value)) {
    return value as UserManagementTab;
  }
  return "all";
}

export type UserStatusFilter = "all" | "active" | "inactive";

export function parseUserStatus(value: string | null): UserStatusFilter {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

export function parseUserClass(value: string | null): string {
  if (value && value.trim()) return value.trim();
  return "all";
}

export function parseView(value: string | null): AppView {
  if (value === "users") return "student-management";
  if (value === "gradebook") return "attendance-management";
  if (value === "class-settings") return "class-detail";
  if (value && VALID_VIEWS.has(value)) {
    return value as AppView;
  }
  return "courses";
}

export function parseAttendanceMonth(
  value: string | null,
  defaultId?: string | null,
): string {
  if (value && value.trim()) return value.trim();
  if (defaultId && defaultId.trim()) return defaultId.trim();
  return "all";
}

