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
  thread: "thread",
  detail: "detail",
  lessonSource: "lessonSource",
  questions: "questions",
  userTab: "userTab",
  userStatus: "userStatus",
  opsTab: "opsTab",
  contentModule: "contentModule",
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
  | "users"
  | "departments"
  | "operations"
  | "course-content";

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
  "users",
  "departments",
  "operations",
  "course-content",
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

export function parseView(value: string | null): AppView {
  if (value && VALID_VIEWS.has(value)) {
    return value as AppView;
  }
  return "courses";
}

export const DEFAULT_SEMESTER = "all";

export function semesterToParam(label: string): string | null {
  if (label === "All Semesters") return null;
  return encodeURIComponent(label);
}

export function semesterFromParam(value: string | null): string {
  if (!value) return "All Semesters";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
