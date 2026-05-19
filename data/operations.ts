export type AssetStatus = "available" | "in-use" | "maintenance";

export interface PhysicalAsset {
  id: number;
  name: string;
  category: string;
  status: AssetStatus;
  location: string;
  assignedTo: string | null;
}

export type RequestIcon = "video" | "laptop" | "room";

export interface TeacherRequest {
  id: number;
  title: string;
  requester: string;
  detail: string;
  icon: RequestIcon;
  status: "pending" | "approved" | "rejected";
}

export type InfraBadgeVariant = "success" | "warning" | "danger";

export interface InfraStatusRow {
  label: string;
  status: string;
  variant: InfraBadgeVariant;
}

/** @deprecated Use operationsService */
export const initialAssets: PhysicalAsset[] = [];
/** @deprecated Use operationsService */
export const initialTeacherRequests: TeacherRequest[] = [];
/** @deprecated Use operationsService.getInfrastructure() */
export const systemHealthRows: InfraStatusRow[] = [];
/** @deprecated Use operationsService.getInfrastructure() */
export const facilityStatusRows: InfraStatusRow[] = [];
