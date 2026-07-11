import { apiClient } from "../api-client";

export type AnnouncementScope = "CLASS" | "SCHOOL" | "ROLE";
export type AnnouncementRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface AnnouncementAttachment {
  id: number;
  fileName: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  downloadUrl: string;
}

export interface Announcement {
  id: number;
  scope: AnnouncementScope;
  targetClassId?: number | null;
  targetClassName?: string | null;
  targetRole?: AnnouncementRole | null;
  title: string;
  body?: string | null;
  pinned: boolean;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  editedAt?: string | null;
  createdAt: string;
  canManage: boolean;
  attachments: AnnouncementAttachment[];
}

export interface AnnouncementPage {
  items: Announcement[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CreateAnnouncementPayload {
  scope: AnnouncementScope;
  targetClassId?: number | null;
  targetRole?: AnnouncementRole | null;
  title: string;
  body?: string;
  pinned?: boolean;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  pinned?: boolean;
}

export const announcementService = {
  async list(page = 0, size = 20): Promise<AnnouncementPage> {
    const response = await apiClient.get<{ data: AnnouncementPage }>("/announcements", {
      params: { page, size },
    });
    return response.data.data;
  },

  async get(id: number): Promise<Announcement> {
    const response = await apiClient.get<{ data: Announcement }>(`/announcements/${id}`);
    return response.data.data;
  },

  async create(payload: CreateAnnouncementPayload): Promise<Announcement> {
    const response = await apiClient.post<{ data: Announcement }>("/announcements", payload);
    return response.data.data;
  },

  async update(id: number, payload: UpdateAnnouncementPayload): Promise<Announcement> {
    const response = await apiClient.put<{ data: Announcement }>(`/announcements/${id}`, payload);
    return response.data.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/announcements/${id}`);
  },

  async uploadAttachments(id: number, files: File[]): Promise<Announcement> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const response = await apiClient.post<{ data: Announcement }>(
      `/announcements/${id}/attachments`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  async deleteAttachment(id: number, attachmentId: number): Promise<void> {
    await apiClient.delete(`/announcements/${id}/attachments/${attachmentId}`);
  },

  // Fetches through apiClient so the Authorization header is attached (the endpoint is guarded).
  async downloadAttachment(id: number, attachmentId: number): Promise<Blob> {
    const response = await apiClient.get(
      `/announcements/${id}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    return response.data as Blob;
  },
};
