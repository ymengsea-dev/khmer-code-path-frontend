import { apiClient } from "../api-client";
import {
  enrichRolePermissions,
} from "../permissions-view";
import type {
  RolePermissions,
  SchoolFeatures,
  UpdateRolePermissionsPayload,
  UpdateSchoolFeaturesPayload,
} from "../types/permissions-api";

export const permissionService = {
  async getTeacherPermissions(): Promise<RolePermissions> {
    const response = await apiClient.get<{ data: RolePermissions }>(
      "/schools/me/permissions/teachers",
    );
    return enrichRolePermissions(response.data.data, "teacher");
  },

  async updateTeacherPermissions(
    payload: UpdateRolePermissionsPayload,
  ): Promise<RolePermissions> {
    const response = await apiClient.put<{ data: RolePermissions }>(
      "/schools/me/permissions/teachers",
      payload,
    );
    return enrichRolePermissions(response.data.data, "teacher");
  },

  async getStudentPermissions(): Promise<RolePermissions> {
    const response = await apiClient.get<{ data: RolePermissions }>(
      "/schools/me/permissions/students",
    );
    return enrichRolePermissions(response.data.data, "student");
  },

  async updateStudentPermissions(
    payload: UpdateRolePermissionsPayload,
  ): Promise<RolePermissions> {
    const response = await apiClient.put<{ data: RolePermissions }>(
      "/schools/me/permissions/students",
      payload,
    );
    return enrichRolePermissions(response.data.data, "student");
  },

  async getSchoolFeatures(): Promise<SchoolFeatures> {
    const response = await apiClient.get<{ data: SchoolFeatures }>(
      "/schools/me/permissions/school-features",
    );
    return response.data.data;
  },

  async updateSchoolFeatures(
    payload: UpdateSchoolFeaturesPayload,
  ): Promise<SchoolFeatures> {
    const response = await apiClient.put<{ data: SchoolFeatures }>(
      "/schools/me/permissions/school-features",
      payload,
    );
    return response.data.data;
  },
};
