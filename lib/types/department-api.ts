export type DepartmentStatusDto = "ACTIVE" | "INACTIVE";
export type DepartmentAccentDto = "VIOLET" | "BLUE" | "EMERALD" | "AMBER";

export interface DepartmentSummaryDto {
  id: number;
  name: string;
  facultyId: number | null;
  facultyName: string | null;
  headOfDept: string;
  teacherCount: number;
  classCount: number;
  capacityPercent: number;
  status: DepartmentStatusDto;
  accent: DepartmentAccentDto;
}

export interface DepartmentOptionDto {
  id: number;
  name: string;
  facultyId: number;
  facultyName: string;
}

export interface DepartmentDetailDto {
  department: DepartmentSummaryDto;
  assignedTeachers: string[];
}

export interface CreateDepartmentPayload {
  name: string;
  facultyId: number;
  headOfDept?: string;
  capacityPercent?: number;
  status?: DepartmentStatusDto;
  accent?: DepartmentAccentDto;
}

export interface UpdateDepartmentPayload {
  name?: string;
  facultyId?: number;
  headOfDept?: string;
  capacityPercent?: number;
  status?: DepartmentStatusDto;
  accent?: DepartmentAccentDto;
}
