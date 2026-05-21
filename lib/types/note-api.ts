export interface NoteSummaryDto {
  id: number;
  title: string;
  preview: string;
  tags: string[];
  favorite: boolean;
  sourceLabel: string | null;
  updatedAt: string;
}

export interface NoteDto {
  id: number;
  title: string;
  bodyHtml: string;
  preview: string;
  tags: string[];
  favorite: boolean;
  shareToken: string | null;
  shareEnabled: boolean;
  sourceLabel: string | null;
  lessonId: number | null;
  materialId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteListDto {
  items: NoteSummaryDto[];
  total: number;
}

export interface SaveNoteRequest {
  title: string;
  bodyHtml: string;
  sourceLabel?: string | null;
  lessonId?: number | null;
  materialId?: number | null;
  tags?: string[];
  favorite?: boolean;
}

export interface NoteShareDto {
  shareToken: string;
  sharePath: string;
}

export interface SharedNoteDto {
  id: number;
  title: string;
  bodyHtml: string;
  preview: string;
  tags: string[];
  sourceLabel: string | null;
  ownerDisplayName: string;
  updatedAt: string;
}
