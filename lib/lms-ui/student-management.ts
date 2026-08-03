export const STUDENT_MANAGEMENT_UI = {
  admin: {
    pageTitle: "User Management",
    pageDescription:
      "Manage students, teachers, and administrators at your school.",
    tabs: [
      { id: "all", label: "All" },
      { id: "students", label: "Students" },
      { id: "teachers", label: "Teachers" },
      { id: "admins", label: "Administrators" },
    ],
  },
  teacher: {
    pageTitle: "User Management",
    pageDescription: "Students enrolled in your classes.",
    tabs: [] as Array<{ id: string; label: string }>,
  },
  statusFilters: [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  cardGradients: [
    "from-indigo-500 to-purple-600",
    "from-blue-600 to-sky-700",
    "from-emerald-600 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
  ],
} as const;

export function studentManagementUi(isAdmin: boolean) {
  return isAdmin ? STUDENT_MANAGEMENT_UI.admin : STUDENT_MANAGEMENT_UI.teacher;
}
