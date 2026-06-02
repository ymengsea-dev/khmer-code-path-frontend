import { apiClient } from "../api-client";
import type {
  GenerateFromContentRequest,
  GenerateQuizRequest,
  LessonSummaryGenerateDto,
  QuizGenerateDto,
} from "../types/lesson-ai-api";

export const lessonAiService = {
  // ── Lesson (class) — file-based (RAG) ────────────────────────────────────

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

  // ── Lesson (class) — written notes (direct LLM, no file) ─────────────────

  async generateSummaryFromLessonContent(
    lessonId: number
  ): Promise<LessonSummaryGenerateDto> {
    const response = await apiClient.post<{ data: LessonSummaryGenerateDto }>(
      `/lessons/${lessonId}/summary/from-content`
    );
    return response.data.data;
  },

  // ── Library template — file-based (RAG) ──────────────────────────────────

  async generateQuizFromLibrary(
    libraryItemId: number,
    request: GenerateQuizRequest
  ): Promise<QuizGenerateDto> {
    const body: Record<string, unknown> = {
      questionCount: request.questionCount ?? 10,
      difficulty: request.difficulty ?? "medium",
    };
    if (request.materialId != null) body.materialId = request.materialId;
    const response = await apiClient.post<{ data: QuizGenerateDto }>(
      `/materials/library/${libraryItemId}/quizzes/generate`,
      body
    );
    return response.data.data;
  },

  // ── Library template — written notes (direct LLM, no file) ───────────────

  async generateQuizFromLibraryContent(
    libraryItemId: number,
    request: GenerateFromContentRequest
  ): Promise<QuizGenerateDto> {
    const response = await apiClient.post<{ data: QuizGenerateDto }>(
      `/materials/library/${libraryItemId}/quizzes/generate-from-content`,
      {
        questionCount: request.questionCount ?? 10,
        difficulty: request.difficulty ?? "medium",
      }
    );
    return response.data.data;
  },

  async generateSummaryFromLibraryContent(
    libraryItemId: number
  ): Promise<LessonSummaryGenerateDto> {
    const response = await apiClient.post<{ data: LessonSummaryGenerateDto }>(
      `/materials/library/${libraryItemId}/summary/from-content`
    );
    return response.data.data;
  },
};
