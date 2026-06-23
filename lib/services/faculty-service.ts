import { apiClient } from "../api-client";
import { resolveApiAssetUrl } from "./school-service";
import type {
  CreateFacultyPayload,
  FacultyConfigDto,
  FacultySummaryDto,
  UpdateFacultyPayload,
} from "../types/faculty-api";

export const facultyService = {
  async getConfig(): Promise<FacultyConfigDto> {
    const response = await apiClient.get<{ data: FacultyConfigDto }>(
      "/schools/me/faculties/config",
    );
    return response.data.data;
  },

  async listFaculties(): Promise<FacultySummaryDto[]> {
    const response = await apiClient.get<{ data: FacultySummaryDto[] }>(
      "/schools/me/faculties",
    );
    return response.data.data ?? [];
  },

  async createFaculty(payload: CreateFacultyPayload): Promise<FacultySummaryDto> {
    const response = await apiClient.post<{ data: FacultySummaryDto }>(
      "/schools/me/faculties",
      payload,
    );
    return response.data.data;
  },

  async updateFaculty(
    id: number,
    payload: UpdateFacultyPayload,
  ): Promise<FacultySummaryDto> {
    const response = await apiClient.put<{ data: FacultySummaryDto }>(
      `/schools/me/faculties/${id}`,
      payload,
    );
    return response.data.data;
  },

  async uploadCover(id: number, file: File): Promise<FacultySummaryDto> {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<{ data: FacultySummaryDto }>(
      `/schools/me/faculties/${id}/cover`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  async removeCover(id: number): Promise<FacultySummaryDto> {
    const response = await apiClient.delete<{ data: FacultySummaryDto }>(
      `/schools/me/faculties/${id}/cover`,
    );
    return response.data.data;
  },

  resolveCoverUrl(coverUrl: string | null | undefined): string | null {
    return resolveApiAssetUrl(coverUrl);
  },

  async fetchCoverBlobUrl(facultyId: number): Promise<string | null> {
    try {
      const response = await apiClient.get(`/schools/me/faculties/${facultyId}/cover`, {
        responseType: "blob",
      });
      return URL.createObjectURL(response.data as Blob);
    } catch {
      return null;
    }
  },
};
