export type AttendanceStatusDto = "PRESENT" | "LATE" | "ABSENT";

export interface AttendanceRecordDto {
  id: number;
  classId: number;
  studentId: string;
  studentName: string;
  sessionDate: string;
  status: AttendanceStatusDto;
}

export interface AttendanceStatisticsDto {
  present: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

export interface AttendanceClassFilterDto {
  value: string;
  label: string;
}

export interface AttendanceMonthFilterDto {
  id: string;
  label: string;
}

export interface AttendanceManagementConfigDto {
  pageTitle: string;
  pageDescription: string;
  classFilters: AttendanceClassFilterDto[];
  monthFilters: AttendanceMonthFilterDto[];
  defaultMonthId: string;
  defaultClassId?: string | null;
  canManageWarnings: boolean;
  canExport: boolean;
}

export interface AttendanceRosterRowDto {
  studentId: string;
  studentName: string;
  studentCode?: string | null;
  avatarUrl?: string | null;
  present: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number | null;
  qualityId: string;
  qualityLabel: string;
  warned: boolean;
}

export interface AttendanceRosterDto {
  classId: number;
  className: string;
  rows: AttendanceRosterRowDto[];
  warnedCount: number;
  classAverageRate: number | null;
}
