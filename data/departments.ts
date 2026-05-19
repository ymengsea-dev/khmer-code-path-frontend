export type DepartmentStatus = "active" | "inactive";

export interface Department {
  id: number;
  name: string;
  faculty: string;
  headOfDept: string;
  facultyCount: number;
  capacityPercent: number;
  status: DepartmentStatus;
  accent: "violet" | "blue" | "emerald" | "amber";
}

/** @deprecated Use departmentService.listDepartments() */
export const initialDepartments: Department[] = [];
