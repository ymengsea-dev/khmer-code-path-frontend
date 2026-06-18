export type ClassStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

export interface ClassSummary {
  id: number;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  semester: string | null;
  academicYear: number | null;
  semesterLabel: string;
  status: ClassStatus;
  statusLabel: string;
  cardGradient: string;
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
  gradingWeights?: GradingWeightsDto;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SemesterFilterDto {
  value: string;
  label: string;
  semester?: string | null;
  academicYear?: number | null;
}

export interface LessonTabDto {
  id: string;
  label: string;
}

export interface GradingWeightsDto {
  attendance: number;
  assignment: number;
  quiz: number;
  midterm: number;
  finalExam: number;
}

export type GradingWeightKey = keyof GradingWeightsDto;

export interface ScoreComponentDto {
  key: GradingWeightKey;
  label: string;
  /** UI color token from API, e.g. emerald, blue */
  color: string;
}

export interface ClassStatusOptionDto {
  value: ClassStatus;
  label: string;
}

export interface ClassSettingsConfigDto {
  classId: number;
  className: string;
  tabs: LessonTabDto[];
  scoreComponents: ScoreComponentDto[];
  statusOptions: ClassStatusOptionDto[];
}

export interface ClassConfigDto {
  allSemestersLabel: string;
  semesterFilters: SemesterFilterDto[];
  lessonTabs: LessonTabDto[];
  cardGradients: string[];
  createDefaults: {
    semester: string;
    academicYear: number;
  };
  gradingWeights?: GradingWeightsDto;
  scoreComponents?: ScoreComponentDto[];
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

export interface UpdateClassPayload {
  code?: string;
  name?: string;
  description?: string;
  semester?: string;
  academicYear?: number;
  schedule?: string;
  roomNumber?: string;
  status?: ClassStatus;
  gradingWeights?: GradingWeightsDto;
}

export interface ClassStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
}
