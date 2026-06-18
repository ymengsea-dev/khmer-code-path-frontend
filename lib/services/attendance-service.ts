import { apiClient } from "../api-client";
import { getValidAccessToken } from "../auth/client-session";
import type {
  AttendanceManagementConfigDto,
  AttendanceRecordDto,
  AttendanceRosterDto,
  AttendanceStatisticsDto,
} from "../types/attendance-api";

export function buildSessionId(classId: number, sessionDate: string): string {
  return `${classId}_${sessionDate}`;
}

export const attendanceService = {
  async getManagementConfig(classId?: number): Promise<AttendanceManagementConfigDto> {
    const response = await apiClient.get<{ data: AttendanceManagementConfigDto }>(
      "/attendance-management/config",
      { params: classId != null ? { classId } : undefined },
    );
    const data = response.data.data;
    return {
      ...data,
      classFilters: data.classFilters ?? [],
      monthFilters: data.monthFilters ?? [],
      defaultMonthId: data.defaultMonthId ?? "all",
      defaultClassId: data.defaultClassId ?? null,
    };
  },

  async getRoster(params: {
    classId: number;
    search?: string;
    month?: string;
  }): Promise<AttendanceRosterDto> {
    const response = await apiClient.get<{ data: AttendanceRosterDto }>(
      "/attendance-management/roster",
      {
        params: {
          classId: params.classId,
          search: params.search?.trim() || undefined,
          month: params.month && params.month !== "all" ? params.month : undefined,
        },
      },
    );
    return response.data.data;
  },

  async setWarning(
    classId: number,
    studentId: string,
    warned: boolean,
  ): Promise<AttendanceRosterDto> {
    const response = await apiClient.patch<{ data: AttendanceRosterDto }>(
      `/attendance-management/classes/${classId}/students/${studentId}/warning`,
      { warned },
    );
    return response.data.data;
  },

  async getStatistics(params: {
    classId?: number;
    studentId?: string;
  }): Promise<AttendanceStatisticsDto> {
    const response = await apiClient.get<{ data: AttendanceStatisticsDto }>(
      "/attendance/statistics",
      { params },
    );
    return response.data.data;
  },

  async getStudentAttendance(
    studentId: string,
    classId?: number,
  ): Promise<AttendanceRecordDto[]> {
    const response = await apiClient.get<{ data: AttendanceRecordDto[] }>(
      `/attendance/students/${studentId}`,
      { params: classId != null ? { classId } : undefined },
    );
    return response.data.data ?? [];
  },

  exportExcelUrl(params: {
    classId: number;
    search?: string;
    month?: string;
  }): string {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
    const url = new URL(`${base}/attendance-management/export`);
    url.searchParams.set("classId", String(params.classId));
    if (params.search?.trim()) {
      url.searchParams.set("search", params.search.trim());
    }
    if (params.month && params.month !== "all") {
      url.searchParams.set("month", params.month);
    }
    return url.toString();
  },

  async downloadExcel(params: {
    classId: number;
    search?: string;
    month?: string;
    filename?: string;
  }): Promise<void> {
    const token = await getValidAccessToken();
    const url = this.exportExcelUrl(params);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error("Export failed");
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const fileName = params.filename ?? match?.[1] ?? "attendance.xlsx";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
