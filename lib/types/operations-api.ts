export type AssetStatusDto = "AVAILABLE" | "IN_USE" | "MAINTENANCE";
export type RequestStatusDto = "PENDING" | "APPROVED" | "REJECTED";
export type RequestIconDto = "VIDEO" | "LAPTOP" | "ROOM";
export type InfrastructureVariantDto = "SUCCESS" | "WARNING" | "DANGER";
export type RoomPurposeDto = "CLASSROOM" | "LAB" | "SEMINAR" | "OTHER";

export interface RoomDto {
  id: number;
  name: string;
  purpose: RoomPurposeDto;
  capacity: number | null;
  notes: string | null;
}

export interface RoomOptionDto {
  id: number;
  name: string;
}

export interface CreateRoomPayload {
  name: string;
  purpose: RoomPurposeDto;
  capacity?: number | null;
  notes?: string | null;
}

export type UpdateRoomPayload = CreateRoomPayload;

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

export type UpdatePhysicalAssetPayload = CreatePhysicalAssetPayload;

export interface CreateFacultyRequestPayload {
  title: string;
  icon: RequestIconDto;
  detail?: string | null;
}

export interface UpdateFacultyRequestPayload {
  status: "APPROVED" | "REJECTED";
  adminComment?: string;
}
