import { apiClient } from "../api-client";
import type { FinalGradeDto, GradeDto } from "../types/grades-api";

export const gradeService = {
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
