export type ClassStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

export type ClassVisibility = "PRIVATE" | "PUBLIC";

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
  visibility?: ClassVisibility;
  visibilityLabel?: string;
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
  visibility?: ClassVisibility;
  visibilityLabel?: string;
  enrollment?: { enrolled: number };
  lessons?: { total: number };
  gradingWeights?: GradingWeightsDto;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  departmentId?: number | null;
  departmentName?: string | null;
  facultyName?: string | null;
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

export interface ClassVisibilityOptionDto {
  value: ClassVisibility;
  label: string;
  description?: string;
}

export interface ClassSettingsConfigDto {
  classId: number;
  className: string;
  tabs: LessonTabDto[];
  scoreComponents: ScoreComponentDto[];
  statusOptions: ClassStatusOptionDto[];
  visibilityOptions: ClassVisibilityOptionDto[];
  publicCoursesEnabled: boolean;
  publicCoursesDisabledHint?: string | null;
  departmentOptions?: DepartmentOptionDto[];
}

export interface DepartmentOptionDto {
  id: number;
  name: string;
  facultyId: number;
  facultyName: string;
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
  departmentOptions?: DepartmentOptionDto[];
}

export interface CreateClassPayload {
  code: string;
  name: string;
  description?: string;
  teacherId: string;
  departmentId: number;
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
  visibility?: ClassVisibility;
  departmentId?: number;
  gradingWeights?: GradingWeightsDto;
}

export interface PublicCourseSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  teacherId: string;
  teacherName: string;
  semester: string | null;
  academicYear: number | null;
  semesterLabel: string;
  status: ClassStatus;
  visibility: ClassVisibility;
  cardGradient: string;
  enrolledCount: number;
  enrolled: boolean;
}

export interface PublicCoursesPage {
  items: PublicCourseSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface PublicCoursesConfigDto {
  pageTitle: string;
  pageDescription: string;
  navLabel: string;
  emptyMessage: string;
  enrollButtonLabel: string;
  enrolledLabel: string;
  searchPlaceholder: string;
  enabled: boolean;
}

export interface ClassStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
}
