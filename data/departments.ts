export type DepartmentStatus = "active" | "inactive";

export interface Department {
  id: number;
  name: string;
  facultyId: number;
  facultyName: string;
  headOfDept: string;
  teacherCount: number;
  classCount: number;
  capacityPercent: number;
  status: DepartmentStatus;
  accent: "violet" | "blue" | "emerald" | "amber";
}

/** @deprecated Use departmentService.listDepartments() */
export const initialDepartments: Department[] = [];
