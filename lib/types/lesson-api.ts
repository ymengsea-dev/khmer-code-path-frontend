export type LibraryIconTypeDto = "SLIDES" | "VIDEO";

export interface LessonSummaryDto {
  id: number;
  classId: number;
  className: string;
  title: string;
  moduleTag: string | null;
  materialCount: number;
  aiReady: boolean;
  createdAt: string;
}

export interface LessonMaterialDto {
  id: number;
  fileName: string;
  contentType: string | null;
  fileSizeBytes: number;
  downloadUrl: string;
}

export interface LessonDetailDto {
  id: number;
  classId: number;
  className: string;
  title: string;
  description: string | null;
  summary: string | null;
  moduleTag: string | null;
  aiReady: boolean;
  materialsProcessing: boolean;
  materials: LessonMaterialDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonPayload {
  classId: number;
  title: string;
  description?: string;
  moduleTag?: string;
  libraryItemId?: number;
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  summary?: string;
  moduleTag?: string;
}

export interface MaterialLibraryItemDto {
  id: number;
  title: string;
  moduleTag: string | null;
  description: string | null;
  iconType: LibraryIconTypeDto;
  gradient: string;
  assetCount: number;
  updatedAt: string;
}

export interface CreateLibraryItemPayload {
  title: string;
  moduleTag?: string;
  description?: string;
  iconType?: LibraryIconTypeDto;
  gradient?: string;
}
