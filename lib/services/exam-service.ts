import { apiClient } from "../api-client";
import type {
  CreateExamPayload,
  ExamAttemptResult,
  ExamDto,
  ExamResults,
} from "../types/assignments-exams-api";

export const examService = {
  async create(payload: CreateExamPayload): Promise<ExamDto> {
    const response = await apiClient.post<{ data: ExamDto }>("/exams", payload);
    return response.data.data;
  },

  async listForTeacher(classId?: number): Promise<ExamDto[]> {
    const params = classId && classId > 0 ? { classId } : undefined;
    const response = await apiClient.get<{ data: ExamDto[] }>("/exams", {
      params,
    });
    return response.data.data ?? [];
  },

  async listAssigned(): Promise<ExamDto[]> {
    const response = await apiClient.get<{ data: ExamDto[] }>(
      "/exams/assigned",
    );
    return response.data.data ?? [];
  },

  async get(id: number): Promise<ExamDto> {
    const response = await apiClient.get<{ data: ExamDto }>(`/exams/${id}`);
    return response.data.data;
  },

  async submit(
    id: number,
    answers: Record<number, number>,
  ): Promise<ExamAttemptResult> {
    const response = await apiClient.post<{ data: ExamAttemptResult }>(
      `/exams/${id}/submit`,
      { answers },
    );
    return response.data.data;
  },

  async fail(id: number, reason: string): Promise<void> {
    await apiClient.post(`/exams/${id}/fail`, { reason });
  },

  async getResults(id: number): Promise<ExamResults> {
    const response = await apiClient.get<{ data: ExamResults }>(
      `/exams/${id}/results`,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/exams/${id}`);
  },
};
