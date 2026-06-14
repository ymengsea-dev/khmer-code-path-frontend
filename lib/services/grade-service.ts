import { apiClient } from "../api-client";
import type { FinalGradeDto, GradeDto, GradebookDto } from "../types/grades-api";

export const gradeService = {
  async getGradebook(classId: number): Promise<GradebookDto> {
    const response = await apiClient.get<{ data: GradebookDto }>(
      `/classes/${classId}/gradebook`
    );
    return response.data.data;
  },

  async createGrade(payload: {
    classId: number;
    studentId: string;
    numericGrade: number;
    letterGrade?: string;
  }): Promise<GradeDto> {
    const response = await apiClient.post<{ data: GradeDto }>("/grades", payload);
    return response.data.data;
  },

  async updateGrade(
    gradeId: number,
    payload: { numericGrade: number; letterGrade?: string }
  ): Promise<GradeDto> {
    const response = await apiClient.put<{ data: GradeDto }>(
      `/grades/${gradeId}`,
      payload
    );
    return response.data.data;
  },

  async getStudentGrades(
    classId: number,
    studentId: string
  ): Promise<GradeDto[]> {
    const response = await apiClient.get<{ data: GradeDto[] }>(
      `/classes/${classId}/students/${studentId}/grades`
    );
    return response.data.data ?? [];
  },

  async calculateFinalGrade(
    classId: number,
    studentId: string
  ): Promise<FinalGradeDto> {
    const response = await apiClient.post<{ data: FinalGradeDto }>(
      `/classes/${classId}/students/${studentId}/final-grade/calculate`
    );
    return response.data.data;
  },
};
