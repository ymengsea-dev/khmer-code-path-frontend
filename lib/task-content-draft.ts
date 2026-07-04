import type { QuizMaterialSource } from "@/lib/quiz-material-sources";
import type { TaskContentBlockInput } from "@/lib/types/assignments-exams-api";

export interface TaskAiBlock {
  id: string;
  sourceKey: string;
  sourceLabel: string;
  questionCount: number;
  generatedContent: string;
}

export interface TaskFileBlock {
  id: string;
  storageKey: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface TaskContentDraft {
  aiBlocks: TaskAiBlock[];
  files: TaskFileBlock[];
  librarySources: QuizMaterialSource[];
}

export function emptyTaskContentDraft(): TaskContentDraft {
  return { aiBlocks: [], files: [], librarySources: [] };
}

export function taskContentDraftHasContent(draft: TaskContentDraft): boolean {
  return (
    draft.aiBlocks.length > 0 ||
    draft.files.length > 0 ||
    draft.librarySources.length > 0
  );
}

export function taskContentDraftAiQuestionCount(draft: TaskContentDraft): number {
  return draft.aiBlocks.reduce((sum, b) => sum + (b.questionCount || 0), 0);
}

export function draftToContentBlocks(
  draft: TaskContentDraft,
): TaskContentBlockInput[] {
  const blocks: TaskContentBlockInput[] = [];
  let order = 0;

  for (const ai of draft.aiBlocks) {
    blocks.push({
      kind: "AI_QUESTIONS",
      orderIndex: order++,
      generatedContent: ai.generatedContent,
      questionCount: ai.questionCount,
      sourceLabel: ai.sourceLabel,
    });
  }

  for (const file of draft.files) {
    blocks.push({
      kind: "FILE",
      orderIndex: order++,
      storageKey: file.storageKey,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      label: file.fileName,
    });
  }

  for (const source of draft.librarySources) {
    blocks.push({
      kind: "LIBRARY_SOURCE",
      orderIndex: order++,
      sourceKind: source.kind,
      lessonId: source.lessonId,
      libraryItemId: source.libraryItemId,
      materialId: source.materialId,
      label: source.label,
    });
  }

  return blocks;
}

export function mergeAiGeneratedContent(draft: TaskContentDraft): string | undefined {
  if (draft.aiBlocks.length === 0) return undefined;
  const merged: unknown[] = [];
  for (const block of draft.aiBlocks) {
    try {
      const cleaned = block.generatedContent
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as unknown;
      if (Array.isArray(parsed)) merged.push(...parsed);
    } catch {
      /* skip invalid */
    }
  }
  return merged.length > 0 ? JSON.stringify(merged, null, 2) : undefined;
}
