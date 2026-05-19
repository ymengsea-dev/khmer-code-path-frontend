export type DepartmentStatusDto = "ACTIVE" | "INACTIVE";
export type DepartmentAccentDto = "VIOLET" | "BLUE" | "EMERALD" | "AMBER";

export interface DepartmentSummaryDto {
  id: number;
  name: string;
  faculty: string | null;
  headOfDept: string;
  facultyCount: number;
  capacityPercent: number;
  status: DepartmentStatusDto;
  accent: DepartmentAccentDto;
}

export interface DepartmentDetailDto {
  department: DepartmentSummaryDto;
  assignedTeachers: string[];
}

export interface CreateDepartmentPayload {
  name: string;
  faculty?: string;
  headOfDept?: string;
  facultyCount?: number;
  capacityPercent?: number;
  status?: DepartmentStatusDto;
  accent?: DepartmentAccentDto;
}

export interface UpdateDepartmentPayload {
  name?: string;
  faculty?: string;
  headOfDept?: string;
  facultyCount?: number;
  capacityPercent?: number;
  status?: DepartmentStatusDto;
  accent?: DepartmentAccentDto;
}
