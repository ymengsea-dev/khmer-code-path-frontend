import { apiClient } from "../api-client";
import type {
  PermissionsConfig,
  RolePermissions,
  SchoolFeatures,
  UpdateRolePermissionsPayload,
  UpdateSchoolFeaturesPayload,
} from "../types/permissions-api";

export const permissionService = {
  async getConfig(): Promise<PermissionsConfig> {
    const response = await apiClient.get<{ data: PermissionsConfig }>(
      "/schools/me/permissions/config",
    );
    return response.data.data;
  },

  async getTeacherPermissions(): Promise<RolePermissions> {
    const response = await apiClient.get<{ data: RolePermissions }>(
      "/schools/me/permissions/teachers",
    );
    return response.data.data;
  },

  async updateTeacherPermissions(
    payload: UpdateRolePermissionsPayload,
  ): Promise<RolePermissions> {
    const response = await apiClient.put<{ data: RolePermissions }>(
      "/schools/me/permissions/teachers",
      payload,
    );
    return response.data.data;
  },

  async getStudentPermissions(): Promise<RolePermissions> {
    const response = await apiClient.get<{ data: RolePermissions }>(
      "/schools/me/permissions/students",
    );
    return response.data.data;
  },

  async updateStudentPermissions(
    payload: UpdateRolePermissionsPayload,
  ): Promise<RolePermissions> {
    const response = await apiClient.put<{ data: RolePermissions }>(
      "/schools/me/permissions/students",
      payload,
    );
    return response.data.data;
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
