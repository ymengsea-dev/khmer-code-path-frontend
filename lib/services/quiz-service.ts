import { apiClient } from "../api-client";
import type {
  CreateQuizPayload,
  QuizAttemptResult,
  QuizDto,
  QuizResults,
  QuizSummary,
  UpdateQuizPayload,
} from "../types/quiz-api";

export const quizService = {
  /** Teacher: publish an AI-generated quiz to a class */
  async publish(payload: CreateQuizPayload): Promise<QuizDto> {
    const response = await apiClient.post<{ data: QuizDto }>("/quizzes", payload);
    return response.data.data;
  },

  /** Teacher: list all quizzes across own classes (optionally filtered by classId) */
  async listForClass(classId?: number): Promise<QuizDto[]> {
    const params = classId && classId > 0 ? { classId } : undefined;
    const response = await apiClient.get<{ data: QuizDto[] }>("/quizzes", { params });
    return response.data.data ?? [];
  },

  /** Student: list quizzes assigned to me */
  async listAssigned(): Promise<QuizDto[]> {
    const response = await apiClient.get<{ data: QuizDto[] }>("/quizzes/assigned");
    return response.data.data ?? [];
  },

  /** Get a single quiz with its questions (answers hidden for students) */
  async getQuiz(id: number): Promise<QuizDto> {
    const response = await apiClient.get<{ data: QuizDto }>(`/quizzes/${id}`);
    return response.data.data;
  },

  /** Teacher: review aggregate results and submissions for a quiz */
  async getResults(id: number): Promise<QuizResults> {
    const response = await apiClient.get<{ data: QuizResults }>(`/quizzes/${id}/results`);
    return response.data.data;
  },

  /** Teacher: update a quiz before student attempts exist */
  async update(quizId: number, payload: UpdateQuizPayload): Promise<QuizDto> {
    const response = await apiClient.put<{ data: QuizDto }>(`/quizzes/${quizId}`, payload);
    return response.data.data;
  },

  /** Student: submit answers — map of questionId → selected option index (0-based) */
  async submit(
    quizId: number,
    answers: Record<number, number>
  ): Promise<QuizAttemptResult> {
    const response = await apiClient.post<{ data: QuizAttemptResult }>(
      `/quizzes/${quizId}/submit`,
      { answers }
    );
    return response.data.data;
  },

  /** Student: mark quiz as failed (tab switch / cheating) */
  async fail(quizId: number, reason: string): Promise<void> {
    await apiClient.post(`/quizzes/${quizId}/fail`, { reason });
  },

  /** Teacher: soft-delete a quiz */
  async delete(quizId: number): Promise<void> {
    await apiClient.delete(`/quizzes/${quizId}`);
  },

  /** Aggregated quiz stats for the current user (role-aware: student vs teacher). */
  async getSummary(): Promise<QuizSummary> {
    const response = await apiClient.get<{ data: QuizSummary }>("/quizzes/summary");
    return response.data.data;
  },
};
