export interface PermissionHighlight {
  label: string;
  granted: boolean;
}

export interface RoleSummary {
  role: string;
  title: string;
  description: string;
  highlights: PermissionHighlight[];
}

export interface GrantablePermission {
  authority: string;
  label: string;
  description: string;
  defaultForTeacher: boolean;
}

export interface GrantableStudentPermission {
  authority: string;
  label: string;
  description: string;
  defaultForStudent: boolean;
}

export interface PermissionsTabConfig {
  id: string;
  label: string;
}

export interface AssignableRole {
  role: string;
  label: string;
}

export interface PermissionsConfig {
  pageTitle: string;
  pageDescription: string;
  saveButtonLabel: string;
  teacherSectionTitle: string;
  teacherSectionDescription: string;
  studentSectionTitle: string;
  studentSectionDescription: string;
  rolesSectionTitle: string;
  rolesSectionDescription: string;
  roleColumnLabel: string;
  statusColumnLabel: string;
  schoolFeaturesSectionTitle: string;
  schoolFeaturesSectionDescription: string;
  publicCoursesFeatureLabel: string;
  publicCoursesFeatureDescription: string;
  tabs: PermissionsTabConfig[];
  assignableRoles: AssignableRole[];
  roleSummaries: RoleSummary[];
  grantablePermissions: GrantablePermission[];
  grantableStudentPermissions: GrantableStudentPermission[];
}

export interface RolePermissionState {
  authority: string;
  label: string;
  description: string;
  defaultGranted: boolean;
  granted: boolean;
  overridden: boolean;
}

export interface RolePermissions {
  role: string;
  permissions: RolePermissionState[];
}

export interface UpdateRolePermissionsPayload {
  permissions: Array<{ authority: string; granted: boolean }>;
}

export interface SchoolFeatures {
  publicCoursesEnabled: boolean;
}

export interface UpdateSchoolFeaturesPayload {
  publicCoursesEnabled: boolean;
}

/** @deprecated Use RolePermissionState */
export type TeacherPermissionState = RolePermissionState;

/** @deprecated Use RolePermissions */
export type TeacherPermissions = RolePermissions;

/** @deprecated Use UpdateRolePermissionsPayload */
export type UpdateTeacherPermissionsPayload = UpdateRolePermissionsPayload;
