export interface GenerateQuizRequest {
  materialId?: number;
  questionCount?: number;
  difficulty?: string;
}

export interface GenerateFromContentRequest {
  questionCount?: number;
  difficulty?: string;
}

export interface LessonSummaryGenerateDto {
  lessonId: number | null;
  materialId: number | null;
  summary: string;
  sourceFileName: string;
  persisted: boolean;
}

export interface LessonCitationDto {
  sourceType: string;
  materialId: number | null;
  sourceName: string;
  chunkIndex: number | null;
  excerpt: string;
}

export interface LessonAnswerDto {
  lessonId: number;
  answer: string;
  citations: LessonCitationDto[];
}

export interface LessonImproveDto {
  lessonId: number;
  improvedContent: string;
  persisted: boolean;
}

export interface MaterialRagStatusDto {
  lessonId: number | null;
  materialId: number;
  status: string;
  chunkCount: number;
  indexedAt: string | null;
  errorMessage: string | null;
}

export interface QuizGenerateDto {
  lessonId: number | null;
  materialId: number | null;
  sourceFileName: string;
  questionCount: number;
  generatedContent: string;
}

export interface LibraryMaterialDto {
  id: number;
  libraryItemId: number;
  fileName: string;
  contentType: string | null;
  fileSizeBytes: number;
  ragStatus?: string;
}
