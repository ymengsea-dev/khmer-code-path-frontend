import { apiClient } from "../api-client";
import type {
  ClassDetail,
  ClassPage,
  ClassStudent,
  CreateClassPayload,
} from "../types/class-api";
import type { ClassComment } from "../types/dashboard-api";
import type { ClassInvitationDto } from "../types/class-invitation-api";

export interface ListClassesParams {
  search?: string;
  teacherId?: string;
  semester?: string;
  academicYear?: number;
  status?: string;
  page?: number;
  size?: number;
}

export const classService = {
  async listClasses(params: ListClassesParams = {}): Promise<ClassPage> {
    const response = await apiClient.get<{ data: ClassPage }>("/classes", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        ...params,
      },
    });
    return response.data.data;
  },

  async getClass(id: number): Promise<ClassDetail> {
    const response = await apiClient.get<{ data: ClassDetail }>(`/classes/${id}`);
    return response.data.data;
  },

  async createClass(payload: CreateClassPayload): Promise<ClassDetail> {
    const response = await apiClient.post<{ data: ClassDetail }>(
      "/classes",
      payload
    );
    return response.data.data;
  },

  async listClassStudents(classId: number): Promise<ClassStudent[]> {
    const response = await apiClient.get<{ data: ClassStudent[] }>(
      `/classes/${classId}/students`
    );
    return response.data.data ?? [];
  },

  /** Sends class invitations; students must accept to enroll. */
  async inviteStudents(classId: number, studentIds: string[]): Promise<void> {
    await apiClient.post(`/classes/${classId}/students`, { studentIds });
  },

  async listMyInvitations(): Promise<ClassInvitationDto[]> {
    const response = await apiClient.get<{ data: ClassInvitationDto[] }>(
      "/classes/invitations/mine"
    );
    return response.data.data ?? [];
  },

  async listClassInvitations(classId: number): Promise<ClassInvitationDto[]> {
    const response = await apiClient.get<{ data: ClassInvitationDto[] }>(
      `/classes/${classId}/invitations`
    );
    return response.data.data ?? [];
  },

  async acceptInvitation(invitationId: number): Promise<ClassInvitationDto> {
    const response = await apiClient.patch<{ data: ClassInvitationDto }>(
      `/classes/invitations/${invitationId}/accept`
    );
    return response.data.data;
  },

  async declineInvitation(invitationId: number): Promise<ClassInvitationDto> {
    const response = await apiClient.patch<{ data: ClassInvitationDto }>(
      `/classes/invitations/${invitationId}/decline`
    );
    return response.data.data;
  },

  async removeStudents(classId: number, studentIds: string[]): Promise<void> {
    await apiClient.delete(`/classes/${classId}/students`, {
      data: { studentIds },
    });
  },

  async listClassComments(classId: number): Promise<ClassComment[]> {
    const response = await apiClient.get<{ data: ClassComment[] }>(
      `/classes/${classId}/comments`
    );
    return response.data.data ?? [];
  },

  async createClassComment(classId: number, body: string): Promise<ClassComment> {
    const response = await apiClient.post<{ data: ClassComment }>(
      `/classes/${classId}/comments`,
      { body }
    );
    return response.data.data;
  },
};
