import { apiClient } from "../api-client";
import type { TaskContentUploadResponse } from "../types/assignments-exams-api";

export const assignmentsExamsService = {
  async uploadContentFile(file: File): Promise<TaskContentUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<{ data: TaskContentUploadResponse }>(
      "/assignments-exams/content/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
};
