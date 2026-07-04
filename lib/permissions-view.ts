import { PERMISSIONS_UI, permissionLabel } from "@/lib/lms-ui/permissions";
import type {
  PermissionsConfig,
  RolePermissionState,
  RolePermissions,
} from "@/lib/types/permissions-api";

export function getPermissionsViewConfig(): PermissionsConfig {
  return {
    pageTitle: PERMISSIONS_UI.pageTitle,
    pageDescription: PERMISSIONS_UI.pageDescription,
    saveButtonLabel: PERMISSIONS_UI.saveButtonLabel,
    teacherSectionTitle: PERMISSIONS_UI.teacherSectionTitle,
    teacherSectionDescription: PERMISSIONS_UI.teacherSectionDescription,
    studentSectionTitle: PERMISSIONS_UI.studentSectionTitle,
    studentSectionDescription: PERMISSIONS_UI.studentSectionDescription,
    rolesSectionTitle: PERMISSIONS_UI.rolesSectionTitle,
    rolesSectionDescription: PERMISSIONS_UI.rolesSectionDescription,
    roleColumnLabel: PERMISSIONS_UI.roleColumnLabel,
    statusColumnLabel: PERMISSIONS_UI.statusColumnLabel,
    schoolFeaturesSectionTitle: PERMISSIONS_UI.schoolFeaturesSectionTitle,
    schoolFeaturesSectionDescription:
      PERMISSIONS_UI.schoolFeaturesSectionDescription,
    publicCoursesFeatureLabel: PERMISSIONS_UI.publicCoursesFeatureLabel,
    publicCoursesFeatureDescription:
      PERMISSIONS_UI.publicCoursesFeatureDescription,
    tabs: [...PERMISSIONS_UI.tabs],
    assignableRoles: [...PERMISSIONS_UI.assignableRoles],
    roleSummaries: PERMISSIONS_UI.roleSummaries.map((r) => ({
      ...r,
      highlights: [...r.highlights],
    })),
    grantablePermissions: PERMISSIONS_UI.grantableTeachers.map((g) => ({
      authority: g.authority,
      label: g.label,
      description: g.description,
      defaultForTeacher: false,
    })),
    grantableStudentPermissions: PERMISSIONS_UI.grantableStudents.map((g) => ({
      authority: g.authority,
      label: g.label,
      description: g.description,
      defaultForStudent: false,
    })),
  };
}

function enrichPermissions(
  permissions: RolePermissionState[],
  role: "teacher" | "student",
): RolePermissionState[] {
  return permissions.map((p) => {
    const meta = permissionLabel(p.authority, role);
    return {
      ...p,
      label: meta.label,
      description: meta.description,
    };
  });
}

export function enrichRolePermissions(
  data: RolePermissions,
  role: "teacher" | "student",
): RolePermissions {
  return {
    ...data,
    permissions: enrichPermissions(data.permissions ?? [], role),
  };
}
