import { apiClient } from "../api-client";
import type {
  AssignmentDto,
  AssignmentSubmissionDto,
  CreateAssignmentPayload,
  GradeAssignmentPayload,
  SubmitAssignmentPayload,
} from "../types/assignments-exams-api";

export const assignmentService = {
  async create(payload: CreateAssignmentPayload): Promise<AssignmentDto> {
    const response = await apiClient.post<{ data: AssignmentDto }>(
      "/assignments",
      payload,
    );
    return response.data.data;
  },

  async listForTeacher(classId?: number): Promise<AssignmentDto[]> {
    const params = classId && classId > 0 ? { classId } : undefined;
    const response = await apiClient.get<{ data: AssignmentDto[] }>(
      "/assignments",
      { params },
    );
    return response.data.data ?? [];
  },

  async listAssigned(): Promise<AssignmentDto[]> {
    const response = await apiClient.get<{ data: AssignmentDto[] }>(
      "/assignments/assigned",
    );
    return response.data.data ?? [];
  },

  async get(id: number): Promise<AssignmentDto> {
    const response = await apiClient.get<{ data: AssignmentDto }>(
      `/assignments/${id}`,
    );
    return response.data.data;
  },

  async submit(
    id: number,
    payload: SubmitAssignmentPayload,
    file?: File | null,
  ): Promise<AssignmentDto> {
    const form = new FormData();
    form.append("content", payload.content);
    if (file) {
      form.append("file", file);
    }
    const response = await apiClient.post<{ data: AssignmentDto }>(
      `/assignments/${id}/submit`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  async getSubmissions(id: number): Promise<AssignmentSubmissionDto[]> {
    const response = await apiClient.get<{ data: AssignmentSubmissionDto[] }>(
      `/assignments/${id}/submissions`,
    );
    return response.data.data ?? [];
  },

  async grade(
    id: number,
    submissionId: number,
    payload: GradeAssignmentPayload,
  ): Promise<AssignmentSubmissionDto> {
    const response = await apiClient.post<{ data: AssignmentSubmissionDto }>(
      `/assignments/${id}/submissions/${submissionId}/grade`,
      payload,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/assignments/${id}`);
  },
};
