import { apiClient } from "../api-client";

export interface AuditLogEntry {
  id: number;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ListAuditLogsParams {
  action?: string;
  actorId?: string;
  page?: number;
  size?: number;
}

export const auditService = {
  async list(params: ListAuditLogsParams = {}): Promise<AuditLogPage> {
    const response = await apiClient.get<{ data: AuditLogPage }>("/audit-logs", {
      params: {
        action: params.action || undefined,
        actorId: params.actorId || undefined,
        page: params.page ?? 0,
        size: params.size ?? 30,
      },
    });
    return response.data.data;
  },
};
