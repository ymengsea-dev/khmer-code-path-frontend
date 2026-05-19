export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface ClassInvitationDto {
  id: number;
  classId: number;
  className: string;
  classCode: string;
  teacherName: string | null;
  studentId: string;
  studentName: string;
  invitedByName: string;
  status: InvitationStatus;
  createdAt: string;
}
