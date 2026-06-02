import { apiClient } from "../api-client";
import type { LibraryMaterialDto } from "../types/lesson-ai-api";
import type {
  CreateLessonPayload,
  CreateLibraryItemPayload,
  LessonDetailDto,
  LessonSummaryDto,
  LibraryMaterialSummaryDto,
  MaterialLibraryConfigDto,
  MaterialLibraryItemDto,
  UpdateLessonPayload,
  UpdateLibraryItemPayload,
} from "../types/lesson-api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const lessonService = {
  async listLessons(classId: number): Promise<LessonSummaryDto[]> {
    const response = await apiClient.get<{ data: LessonSummaryDto[] }>(
      "/lessons",
      { params: { classId } }
    );
    return response.data.data ?? [];
  },

  async getLesson(id: number): Promise<LessonDetailDto> {
    const response = await apiClient.get<{ data: LessonDetailDto }>(
      `/lessons/${id}`
    );
    return response.data.data;
  },

  async createLesson(payload: CreateLessonPayload): Promise<LessonDetailDto> {
    const response = await apiClient.post<{ data: LessonDetailDto }>(
      "/lessons",
      payload
    );
    return response.data.data;
  },

  async updateLesson(
    id: number,
    payload: UpdateLessonPayload
  ): Promise<LessonDetailDto> {
    const response = await apiClient.put<{ data: LessonDetailDto }>(
      `/lessons/${id}`,
      payload
    );
    return response.data.data;
  },

  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/lessons/${id}`);
  },

  async uploadMaterials(
    lessonId: number,
    files: File[]
  ): Promise<void> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    await apiClient.post(`/lessons/${lessonId}/materials`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  materialDownloadUrl(lessonId: number, materialId: number): string {
    return `${API_BASE}/lessons/${lessonId}/materials/${materialId}/download`;
  },

  async getLibraryConfig(): Promise<MaterialLibraryConfigDto> {
    const response = await apiClient.get<{ data: MaterialLibraryConfigDto }>(
      "/materials/library/config"
    );
    return response.data.data;
  },

  async listLibrary(params: {
    search?: string;
    moduleTag?: string;
  } = {}): Promise<MaterialLibraryItemDto[]> {
    const response = await apiClient.get<{ data: MaterialLibraryItemDto[] }>(
      "/materials/library",
      { params }
    );
    return response.data.data ?? [];
  },

  async createLibraryItem(
    payload: CreateLibraryItemPayload
  ): Promise<MaterialLibraryItemDto> {
    const response = await apiClient.post<{ data: MaterialLibraryItemDto }>(
      "/materials/library",
      payload
    );
    return response.data.data;
  },

  async getLibraryItem(libraryItemId: number): Promise<MaterialLibraryItemDto> {
    const response = await apiClient.get<{ data: MaterialLibraryItemDto }>(
      `/materials/library/${libraryItemId}`
    );
    return response.data.data;
  },

  async updateLibraryItem(
    libraryItemId: number,
    payload: UpdateLibraryItemPayload
  ): Promise<MaterialLibraryItemDto> {
    const response = await apiClient.put<{ data: MaterialLibraryItemDto }>(
      `/materials/library/${libraryItemId}`,
      payload
    );
    return response.data.data;
  },

  async uploadLibraryMaterials(libraryItemId: number, files: File[]): Promise<void> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    await apiClient.post(`/materials/library/${libraryItemId}/materials`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async listLibraryMaterials(libraryItemId: number): Promise<LibraryMaterialDto[]> {
    const response = await apiClient.get<{ data: LibraryMaterialDto[] }>(
      `/materials/library/${libraryItemId}/materials`
    );
    return response.data.data ?? [];
  },

  async assignLibraryToClass(
    libraryItemId: number,
    targetClassId: number
  ): Promise<LessonDetailDto> {
    const response = await apiClient.post<{ data: LessonDetailDto }>(
      `/materials/library/${libraryItemId}/assign`,
      { targetClassId }
    );
    return response.data.data;
  },

  async deleteLibraryItem(libraryItemId: number): Promise<void> {
    await apiClient.delete(`/materials/library/${libraryItemId}`);
  },

  async deleteLibraryMaterial(libraryItemId: number, materialId: number): Promise<void> {
    await apiClient.delete(`/materials/library/${libraryItemId}/materials/${materialId}`);
  },

  async linkLibraryMaterials(
    libraryItemId: number,
    sourceMaterialIds: number[]
  ): Promise<LibraryMaterialSummaryDto[]> {
    const response = await apiClient.post<{ data: LibraryMaterialSummaryDto[] }>(
      `/materials/library/${libraryItemId}/materials/link`,
      { sourceMaterialIds }
    );
    return response.data.data ?? [];
  },

  async listLibraryPoolFiles(search?: string): Promise<LibraryMaterialSummaryDto[]> {
    const response = await apiClient.get<{ data: LibraryMaterialSummaryDto[] }>(
      "/materials/library/files",
      { params: search ? { search } : undefined }
    );
    return response.data.data ?? [];
  },

  async uploadLibraryPoolFiles(files: File[]): Promise<void> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    await apiClient.post("/materials/library/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async deleteLibraryPoolFile(materialId: number): Promise<void> {
    await apiClient.delete(`/materials/library/files/${materialId}`);
  },
};
