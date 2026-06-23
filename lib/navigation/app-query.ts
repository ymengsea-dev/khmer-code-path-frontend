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
  schoolTab: "schoolTab",
  permissionsTab: "permissionsTab",
  faculty: "faculty",
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
  | "faculty-management"
  | "faculty-detail"
  | "roles-permissions"
  | "public-courses"
  | "course-content"
  | "class-detail";

export type SchoolManagementTab = "profile" | "registration-domains";

export type RolesPermissionsTab = "roles" | "permissions";

const VALID_PERMISSIONS_TABS = new Set<string>(["roles", "permissions"]);

export function parsePermissionsTab(value: string | null): RolesPermissionsTab {
  if (value && VALID_PERMISSIONS_TABS.has(value)) {
    return value as RolesPermissionsTab;
  }
  return "roles";
}

export type UserManagementTab =
  | "all"
  | "students"
  | "teachers"
  | "admins";

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
  "faculty-management",
  "faculty-detail",
  "roles-permissions",
  "public-courses",
  "course-content",
  "class-detail",
]);

const VALID_USER_TABS = new Set<string>([
  "all",
  "students",
  "teachers",
  "admins",
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

const VALID_SCHOOL_TABS = new Set<string>(["profile", "registration-domains"]);

export function parseSchoolTab(value: string | null): SchoolManagementTab {
  if (value && VALID_SCHOOL_TABS.has(value)) {
    return value as SchoolManagementTab;
  }
  return "profile";
}

export function parseView(value: string | null): AppView {
  if (value === "users") return "student-management";
  if (value === "gradebook") return "attendance-management";
  if (value === "class-settings") return "class-detail";
  if (value === "permissions") return "roles-permissions";
  if (value === "school-management") return "faculty-management";
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

