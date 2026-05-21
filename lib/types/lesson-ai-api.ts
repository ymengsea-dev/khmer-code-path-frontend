export interface GenerateQuizRequest {
  materialId: number;
  questionCount?: number;
  difficulty?: string;
}

export interface LessonSummaryGenerateDto {
  lessonId: number;
  materialId: number;
  summary: string;
  sourceFileName: string;
  persisted: boolean;
}

export interface QuizGenerateDto {
  lessonId: number | null;
  materialId: number;
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
