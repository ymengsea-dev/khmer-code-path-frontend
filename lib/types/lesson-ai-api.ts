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
