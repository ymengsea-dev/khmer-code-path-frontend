export const PERMISSIONS_UI = {
  pageTitle: "Roles & Permissions",
  pageDescription: "",
  selectTeacherLabel: "Select teacher",
  saveButtonLabel: "Save permissions",
  teacherSectionTitle: "Teacher permissions",
  teacherSectionDescription:
    "Toggle capabilities for all teachers at your school. Changes apply on their next request.",
  studentSectionTitle: "Student permissions",
  studentSectionDescription:
    "Toggle capabilities for all students at your school. Changes apply on their next request.",
  rolesSectionTitle: "School members",
  rolesSectionDescription:
    "View every user at your school and assign their role. Changes are saved immediately.",
  roleColumnLabel: "Role",
  statusColumnLabel: "Status",
  schoolFeaturesSectionTitle: "School features",
  schoolFeaturesSectionDescription:
    "Enable optional capabilities for your school. Teachers only see options that are turned on here.",
  publicCoursesFeatureLabel: "Public courses",
  publicCoursesFeatureDescription:
    "Allow teachers to mark classes as public so students can self-enroll from the Public Courses page.",
  tabs: [
    { id: "roles", label: "Roles" },
    { id: "permissions", label: "Permissions" },
  ],
  assignableRoles: [
    { role: "STUDENT", label: "Student" },
    { role: "TEACHER", label: "Teacher" },
    { role: "ADMIN", label: "Administrator" },
  ],
  roleSummaries: [
    {
      role: "ADMIN",
      title: "School Administrator",
      description: "Full control of the school tenant, members, and settings.",
      highlights: [
        { label: "Manage users", granted: true },
        { label: "School settings", granted: true },
        { label: "Operations", granted: true },
        { label: "Academic records", granted: true },
      ],
    },
    {
      role: "TEACHER",
      title: "Teacher",
      description:
        "Teaches classes and supports students. Defaults can be customized below.",
      highlights: [
        { label: "Manage classes", granted: true },
        { label: "Lessons & quizzes", granted: true },
        { label: "Grades & attendance", granted: true },
        { label: "User management", granted: false },
      ],
    },
    {
      role: "STUDENT",
      title: "Student",
      description: "Learns in enrolled classes and uses personal study tools.",
      highlights: [
        { label: "View classes", granted: true },
        { label: "Submit quizzes", granted: true },
        { label: "AI chat & notebook", granted: true },
        { label: "User management", granted: false },
      ],
    },
  ],
  grantableTeachers: [
    {
      authority: "lms:usr:manage",
      label: "Manage users",
      description: "Create, import, and edit student accounts.",
    },
    {
      authority: "lms:cls:manage",
      label: "Manage classes",
      description: "Create and configure classes, enrollments, and class settings.",
    },
    {
      authority: "lms:crs:manage",
      label: "Manage course catalog",
      description: "Create and edit courses in the catalog.",
    },
    {
      authority: "lms:lsn:manage",
      label: "Manage lessons",
      description: "Create lessons and upload class materials.",
    },
    {
      authority: "lms:att:manage",
      label: "Manage attendance",
      description: "Record and update student attendance.",
    },
    {
      authority: "lms:grd:manage",
      label: "Manage grades",
      description: "Record and update student grades.",
    },
    {
      authority: "lms:ai:ingest",
      label: "Index materials for AI",
      description: "Upload and index lesson files for AI retrieval.",
    },
    {
      authority: "lms:ops:manage",
      label: "School operations",
      description: "Access inventory, requests, and infrastructure tools.",
    },
    {
      authority: "lms:school:manage",
      label: "School settings",
      description: "Edit school profile, registration portal, and permissions.",
    },
  ],
  grantableStudents: [
    {
      authority: "lms:ai:chat",
      label: "AI Chat",
      description: "Use the AI learning assistant.",
    },
    {
      authority: "lms:cls:read",
      label: "View classes",
      description: "Browse enrolled and available classes.",
    },
    {
      authority: "lms:crs:read",
      label: "View course catalog",
      description: "Browse courses in the catalog.",
    },
    {
      authority: "lms:dash:read",
      label: "View dashboard",
      description: "Access the personal learning dashboard.",
    },
    {
      authority: "lms:prog:read",
      label: "View progress",
      description: "Track personal learning progress.",
    },
    {
      authority: "lms:ai:ingest",
      label: "Index materials for AI",
      description: "Upload and index files for AI retrieval.",
    },
    {
      authority: "lms:lsn:manage",
      label: "Manage lessons",
      description: "Create lessons and upload class materials.",
    },
    {
      authority: "lms:cls:manage",
      label: "Manage classes",
      description: "Create and configure classes.",
    },
  ],
} as const;

export function permissionLabel(
  authority: string,
  role: "teacher" | "student",
): { label: string; description: string } {
  const list =
    role === "teacher"
      ? PERMISSIONS_UI.grantableTeachers
      : PERMISSIONS_UI.grantableStudents;
  const match = list.find((p) => p.authority === authority);
  return match ?? { label: authority, description: "" };
}
