export type AssetStatusDto = "AVAILABLE" | "IN_USE" | "MAINTENANCE";
export type RequestStatusDto = "PENDING" | "APPROVED" | "REJECTED";
export type RequestIconDto = "VIDEO" | "LAPTOP" | "ROOM";
export type InfrastructureVariantDto = "SUCCESS" | "WARNING" | "DANGER";

export interface PhysicalAssetDto {
  id: number;
  name: string;
  category: string;
  status: AssetStatusDto;
  location: string;
  assignedTo: string | null;
}

export interface FacultyRequestDto {
  id: number;
  title: string;
  requester: string;
  detail: string;
  icon: RequestIconDto;
  status: RequestStatusDto;
}

export interface InfrastructureRowDto {
  label: string;
  status: string;
  variant: InfrastructureVariantDto;
}

export interface InfrastructureDto {
  systemHealth: InfrastructureRowDto[];
  facilityStatus: InfrastructureRowDto[];
}

export interface CreatePhysicalAssetPayload {
  name: string;
  category: string;
  status: AssetStatusDto;
  location: string;
  assignedTo?: string | null;
}

export interface UpdateFacultyRequestPayload {
  status: "APPROVED" | "REJECTED";
  adminComment?: string;
}
