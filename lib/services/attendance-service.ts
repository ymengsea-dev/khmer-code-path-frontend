import { apiClient } from "../api-client";
import type {
  AttendanceRecordDto,
  AttendanceStatisticsDto,
} from "../types/attendance-api";

export function buildSessionId(classId: number, sessionDate: string): string {
  return `${classId}_${sessionDate}`;
}

export const attendanceService = {
  async getStatistics(params: {
    classId?: number;
    studentId?: string;
  }): Promise<AttendanceStatisticsDto> {
    const response = await apiClient.get<{ data: AttendanceStatisticsDto }>(
      "/attendance/statistics",
      { params }
    );
    return response.data.data;
  },

  async getStudentAttendance(
    studentId: string,
    classId?: number
  ): Promise<AttendanceRecordDto[]> {
    const response = await apiClient.get<{ data: AttendanceRecordDto[] }>(
      `/attendance/students/${studentId}`,
      { params: classId != null ? { classId } : undefined }
    );
    return response.data.data ?? [];
  },
};
