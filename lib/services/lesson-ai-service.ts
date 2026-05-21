import { apiClient } from "../api-client";
import type {
  GenerateQuizRequest,
  LessonSummaryGenerateDto,
  QuizGenerateDto,
} from "../types/lesson-ai-api";

export const lessonAiService = {
  async generateSummaryFromLesson(
    lessonId: number,
    materialId: number
  ): Promise<LessonSummaryGenerateDto> {
    const response = await apiClient.post<{ data: LessonSummaryGenerateDto }>(
      `/lessons/${lessonId}/summary`,
      null,
      { params: { materialId } }
    );
    return response.data.data;
  },
  async generateQuizFromLesson(
    lessonId: number,
    request: GenerateQuizRequest
  ): Promise<QuizGenerateDto> {
    const response = await apiClient.post<{ data: QuizGenerateDto }>(
      `/lessons/${lessonId}/quizzes/generate`,
      {
        materialId: request.materialId,
        questionCount: request.questionCount ?? 10,
        difficulty: request.difficulty ?? "medium",
      }
    );
    return response.data.data;
  },

  async generateQuizFromLibrary(
    libraryItemId: number,
    request: GenerateQuizRequest
  ): Promise<QuizGenerateDto> {
    const response = await apiClient.post<{ data: QuizGenerateDto }>(
      `/materials/library/${libraryItemId}/quizzes/generate`,
      {
        materialId: request.materialId,
        questionCount: request.questionCount ?? 10,
        difficulty: request.difficulty ?? "medium",
      }
    );
    return response.data.data;
  },
};
