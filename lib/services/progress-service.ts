import { apiClient } from "../api-client";
import type { GradeBreakdownDto, ClassProgressDto } from "../types/progress-api";

export const progressService = {
  async getGradeBreakdown(studentId: string): Promise<GradeBreakdownDto[]> {
    const response = await apiClient.get<{ data: GradeBreakdownDto[] }>(
      `/progress/students/${studentId}/grades/breakdown`
    );
    return response.data.data ?? [];
  },

  async getClassProgress(
    studentId: string,
    classId: number
  ): Promise<ClassProgressDto> {
    const response = await apiClient.get<{ data: ClassProgressDto }>(
      `/progress/students/${studentId}/classes/${classId}`
    );
    return response.data.data;
  },
};
