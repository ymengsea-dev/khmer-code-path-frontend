export type ClassStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

export interface ClassSummary {
  id: number;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  semester: string | null;
  academicYear: number | null;
  status: ClassStatus;
  enrolledCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassPage {
  items: ClassSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ClassDetail {
  id: number;
  code: string;
  name: string;
  description: string | null;
  semester: string | null;
  academicYear: number | null;
  schedule: string | null;
  roomNumber: string | null;
  status: ClassStatus;
  enrollment?: { enrolled: number };
  lessons?: { total: number };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateClassPayload {
  code: string;
  name: string;
  description?: string;
  teacherId: string;
  semester?: string;
  academicYear?: number;
  schedule?: string;
  roomNumber?: string;
  status?: ClassStatus;
}

export interface ClassStudent {
  id: string;
  name: string;
  email: string;
  studentId?: string | null;
}
