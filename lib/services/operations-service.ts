import { apiClient } from "../api-client";
import type {
  AssetStatus,
  InfraStatusRow,
  PhysicalAsset,
  TeacherRequest,
} from "@/data/operations";
import type {
  AssetStatusDto,
  CreatePhysicalAssetPayload,
  FacultyRequestDto,
  InfrastructureDto,
  InfrastructureVariantDto,
  PhysicalAssetDto,
  RequestIconDto,
  RequestStatusDto,
} from "../types/operations-api";

function mapAssetStatus(status: AssetStatusDto): AssetStatus {
  if (status === "AVAILABLE") return "available";
  if (status === "IN_USE") return "in-use";
  return "maintenance";
}

function toAssetStatusDto(status: AssetStatus): AssetStatusDto {
  if (status === "available") return "AVAILABLE";
  if (status === "in-use") return "IN_USE";
  return "MAINTENANCE";
}

function mapRequestIcon(icon: RequestIconDto): TeacherRequest["icon"] {
  if (icon === "VIDEO") return "video";
  if (icon === "LAPTOP") return "laptop";
  return "room";
}

function mapRequestStatus(
  status: RequestStatusDto
): TeacherRequest["status"] {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function mapInfraVariant(
  variant: InfrastructureVariantDto
): InfraStatusRow["variant"] {
  if (variant === "SUCCESS") return "success";
  if (variant === "WARNING") return "warning";
  return "danger";
}

export function mapAssetDto(dto: PhysicalAssetDto): PhysicalAsset {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    status: mapAssetStatus(dto.status),
    location: dto.location,
    assignedTo: dto.assignedTo,
  };
}

export function mapRequestDto(dto: FacultyRequestDto): TeacherRequest {
  return {
    id: dto.id,
    title: dto.title,
    requester: dto.requester,
    detail: dto.detail,
    icon: mapRequestIcon(dto.icon),
    status: mapRequestStatus(dto.status),
  };
}

function mapInfraRows(
  rows: InfrastructureDto["systemHealth"]
): InfraStatusRow[] {
  return rows.map((row) => ({
    label: row.label,
    status: row.status,
    variant: mapInfraVariant(row.variant),
  }));
}

export const operationsService = {
  async listInventory(): Promise<PhysicalAsset[]> {
    const response = await apiClient.get<{ data: PhysicalAssetDto[] }>(
      "/operations/inventory"
    );
    return (response.data.data ?? []).map(mapAssetDto);
  },

  async createAsset(values: {
    name: string;
    category: string;
    status: AssetStatus;
    location: string;
    assignedTo: string;
  }): Promise<PhysicalAsset> {
    const payload: CreatePhysicalAssetPayload = {
      name: values.name.trim(),
      category: values.category.trim(),
      status: toAssetStatusDto(values.status),
      location: values.location.trim(),
      assignedTo: values.assignedTo.trim() || null,
    };
    const response = await apiClient.post<{ data: PhysicalAssetDto }>(
      "/operations/inventory",
      payload
    );
    return mapAssetDto(response.data.data);
  },

  async listRequests(status?: "pending"): Promise<TeacherRequest[]> {
    const response = await apiClient.get<{ data: FacultyRequestDto[] }>(
      "/operations/requests",
      {
        params: status === "pending" ? { status: "PENDING" } : undefined,
      }
    );
    return (response.data.data ?? []).map(mapRequestDto);
  },

  async updateRequestStatus(
    id: number,
    status: "APPROVED" | "REJECTED"
  ): Promise<TeacherRequest> {
    const response = await apiClient.patch<{ data: FacultyRequestDto }>(
      `/operations/requests/${id}`,
      { status }
    );
    return mapRequestDto(response.data.data);
  },

  async getInfrastructure(): Promise<{
    systemHealth: InfraStatusRow[];
    facilityStatus: InfraStatusRow[];
  }> {
    const response = await apiClient.get<{ data: InfrastructureDto }>(
      "/operations/infrastructure"
    );
    const data = response.data.data;
    return {
      systemHealth: mapInfraRows(data.systemHealth ?? []),
      facilityStatus: mapInfraRows(data.facilityStatus ?? []),
    };
  },
};
