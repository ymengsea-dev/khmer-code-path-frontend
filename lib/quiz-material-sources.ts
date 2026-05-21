import { classService } from "@/lib/services/class-service";
import { lessonService } from "@/lib/services/lesson-service";
import type { LibraryMaterialDto } from "@/lib/types/lesson-ai-api";

export type QuizSourceKind = "lesson" | "library";

export interface QuizMaterialSource {
  key: string;
  kind: QuizSourceKind;
  lessonId?: number;
  libraryItemId?: number;
  materialId: number;
  label: string;
  fileName: string;
  group: string;
}

function lessonKey(lessonId: number, materialId: number) {
  return `lesson:${lessonId}:${materialId}`;
}

function libraryKey(libraryItemId: number, materialId: number) {
  return `library:${libraryItemId}:${materialId}`;
}

export function parseQuizMaterialSourceKey(key: string): QuizMaterialSource | null {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  const [kind, ownerId, materialId] = parts;
  const matId = Number(materialId);
  const owner = Number(ownerId);
  if (Number.isNaN(matId) || Number.isNaN(owner)) return null;

  if (kind === "lesson") {
    return {
      key,
      kind: "lesson",
      lessonId: owner,
      materialId: matId,
      label: "",
      fileName: "",
      group: "",
    };
  }
  if (kind === "library") {
    return {
      key,
      kind: "library",
      libraryItemId: owner,
      materialId: matId,
      label: "",
      fileName: "",
      group: "",
    };
  }
  return null;
}

/**
 * Builds selectable quiz sources from class lessons (course content) and library templates.
 */
export async function loadQuizMaterialSources(): Promise<QuizMaterialSource[]> {
  const sources: QuizMaterialSource[] = [];

  const classPage = await classService.listClasses({ size: 100 });
  for (const cls of classPage.items) {
    const lessons = await lessonService.listLessons(cls.id);
    for (const lesson of lessons) {
      if (lesson.materialCount <= 0) continue;
      let detail;
      try {
        detail = await lessonService.getLesson(lesson.id);
      } catch {
        continue;
      }
      for (const mat of detail.materials) {
        sources.push({
          key: lessonKey(lesson.id, mat.id),
          kind: "lesson",
          lessonId: lesson.id,
          materialId: mat.id,
          fileName: mat.fileName,
          group: `Class: ${cls.name}`,
          label: `${lesson.title} — ${mat.fileName}`,
        });
      }
    }
  }

  const templates = await lessonService.listLibrary();
  for (const template of templates) {
    if (template.assetCount <= 0) continue;
    let materials: LibraryMaterialDto[];
    try {
      materials = await lessonService.listLibraryMaterials(template.id);
    } catch {
      continue;
    }
    for (const mat of materials) {
      sources.push({
        key: libraryKey(template.id, mat.id),
        kind: "library",
        libraryItemId: template.id,
        materialId: mat.id,
        fileName: mat.fileName,
        group: "Lesson templates (Course Content)",
        label: `${template.title} — ${mat.fileName}`,
      });
    }
  }

  sources.sort((a, b) => {
    const g = a.group.localeCompare(b.group);
    return g !== 0 ? g : a.label.localeCompare(b.label);
  });

  return sources;
}
