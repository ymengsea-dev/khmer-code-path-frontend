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
