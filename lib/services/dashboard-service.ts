import { apiClient } from "../api-client";
import type {
  AdminDashboard,
  StudentDashboard,
  TeacherDashboard,
} from "../types/dashboard-api";

export const dashboardService = {
  async getStudentDashboard(): Promise<StudentDashboard> {
    const response = await apiClient.get<{ data: StudentDashboard }>(
      "/dashboard/student"
    );
    return response.data.data;
  },

  async getTeacherDashboard(): Promise<TeacherDashboard> {
    const response = await apiClient.get<{ data: TeacherDashboard }>(
      "/dashboard/teacher"
    );
    return response.data.data;
  },

  async getAdminDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<{ data: AdminDashboard }>(
      "/dashboard/admin"
    );
    return response.data.data;
  },
};
