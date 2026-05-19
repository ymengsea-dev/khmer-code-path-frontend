export type NotificationType =
  | "GRADE_POSTED"
  | "ATTENDANCE_RECORDED"
  | "CLASS_QUESTION"
  | "LESSON_PUBLISHED"
  | "QUIZ_SUBMITTED"
  | "CLASS_INVITATION"
  | "SYSTEM";

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  classId: number | null;
  className: string | null;
  resourceType: string | null;
  resourceId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationListDto {
  items: NotificationDto[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountDto {
  count: number;
}
