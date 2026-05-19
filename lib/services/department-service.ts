import { apiClient } from "../api-client";
import type { Department } from "@/data/departments";
import type {
  CreateDepartmentPayload,
  DepartmentDetailDto,
  DepartmentSummaryDto,
  DepartmentAccentDto,
  DepartmentStatusDto,
  UpdateDepartmentPayload,
} from "../types/department-api";

function mapStatus(status: DepartmentStatusDto): Department["status"] {
  return status === "ACTIVE" ? "active" : "inactive";
}

function mapAccent(accent: DepartmentAccentDto): Department["accent"] {
  const map: Record<DepartmentAccentDto, Department["accent"]> = {
    VIOLET: "violet",
    BLUE: "blue",
    EMERALD: "emerald",
    AMBER: "amber",
  };
  return map[accent] ?? "violet";
}

export function mapDepartmentDto(dto: DepartmentSummaryDto): Department {
  return {
    id: dto.id,
    name: dto.name,
    faculty: dto.faculty ?? "",
    headOfDept: dto.headOfDept,
    facultyCount: dto.facultyCount,
    capacityPercent: dto.capacityPercent,
    status: mapStatus(dto.status),
    accent: mapAccent(dto.accent),
  };
}

function toStatusDto(status: Department["status"]): DepartmentStatusDto {
  return status === "active" ? "ACTIVE" : "INACTIVE";
}

export const departmentService = {
  async listDepartments(): Promise<Department[]> {
    const response = await apiClient.get<{ data: DepartmentSummaryDto[] }>(
      "/departments"
    );
    return (response.data.data ?? []).map(mapDepartmentDto);
  },

  async getDepartment(id: number): Promise<DepartmentDetailDto> {
    const response = await apiClient.get<{ data: DepartmentDetailDto }>(
      `/departments/${id}`
    );
    return response.data.data;
  },

  async createDepartment(
    payload: CreateDepartmentPayload
  ): Promise<Department> {
    const response = await apiClient.post<{ data: DepartmentSummaryDto }>(
      "/departments",
      payload
    );
    return mapDepartmentDto(response.data.data);
  },

  async updateDepartment(
    id: number,
    payload: UpdateDepartmentPayload
  ): Promise<Department> {
    const response = await apiClient.put<{ data: DepartmentSummaryDto }>(
      `/departments/${id}`,
      payload
    );
    return mapDepartmentDto(response.data.data);
  },

  buildCreatePayload(values: {
    name: string;
    faculty: string;
    headOfDept: string;
    facultyCount: number;
    capacityPercent: number;
    status: Department["status"];
  }): CreateDepartmentPayload {
    return {
      name: values.name.trim(),
      faculty: values.faculty.trim() || undefined,
      headOfDept: values.headOfDept.trim() || undefined,
      facultyCount: values.facultyCount,
      capacityPercent: values.capacityPercent,
      status: toStatusDto(values.status),
    };
  },

  buildUpdatePayload(values: {
    name: string;
    faculty: string;
    headOfDept: string;
    facultyCount: number;
    capacityPercent: number;
    status: Department["status"];
  }): UpdateDepartmentPayload {
    return {
      name: values.name.trim(),
      faculty: values.faculty.trim() || undefined,
      headOfDept: values.headOfDept.trim() || undefined,
      facultyCount: values.facultyCount,
      capacityPercent: values.capacityPercent,
      status: toStatusDto(values.status),
    };
  },
};
