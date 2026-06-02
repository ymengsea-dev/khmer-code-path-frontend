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
  /** NOT_INDEXED until quiz/summary triggers on-demand RAG indexing */
  ragStatus?: string;
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

export interface LibraryMaterialSummaryDto {
  id: number;
  libraryItemId: number;
  fileName: string;
  contentType: string | null;
  fileSizeBytes: number;
  ragStatus?: string;
  /** True when stored in the teacher file pool (not on a lesson template). */
  poolFile?: boolean;
}

export interface LibraryViewDto {
  id: string;
  label: string;
  searchPlaceholder?: string | null;
}

export interface LibraryCreateDefaultsDto {
  title: string;
  iconType: LibraryIconTypeDto;
  gradient: string;
}

export interface MaterialLibraryConfigDto {
  views: LibraryViewDto[];
  createDefaults: LibraryCreateDefaultsDto;
  uploadAccept: string;
  filePoolLabel?: string;
}

export interface MaterialLibraryItemDto {
  id: number;
  title: string;
  moduleTag: string | null;
  description: string | null;
  iconType: LibraryIconTypeDto;
  gradient: string;
  assetCount: number;
  materials?: LibraryMaterialSummaryDto[];
  updatedAt: string;
}

export interface CreateLibraryItemPayload {
  title: string;
  moduleTag?: string;
  description?: string;
  iconType?: LibraryIconTypeDto;
  gradient?: string;
}

export interface UpdateLibraryItemPayload {
  title?: string;
  moduleTag?: string;
  description?: string;
  iconType?: LibraryIconTypeDto;
  gradient?: string;
}
