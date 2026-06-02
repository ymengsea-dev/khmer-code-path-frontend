import type {
  LibraryMaterialSummaryDto,
  MaterialLibraryItemDto,
} from "@/lib/types/lesson-api";

export interface LibraryAttachmentRow extends LibraryMaterialSummaryDto {
  templateId: number;
  templateTitle: string;
  poolFile: boolean;
}

export function resolveContentTab(
  value: string | null,
  viewIds: string[]
): string {
  const fallback = viewIds[0] ?? "all";
  if (value && viewIds.includes(value)) return value;
  return fallback;
}

export function poolFilesToAttachmentRows(
  files: LibraryMaterialSummaryDto[],
  filePoolLabel: string
): LibraryAttachmentRow[] {
  return files
    .map((file) => ({
      ...file,
      templateId: file.libraryItemId,
      templateTitle: filePoolLabel,
      poolFile: true,
    }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

/** Files attached directly to lesson templates (editor uploads), not the shared pool. */
export function flattenTemplateAttachments(
  templates: MaterialLibraryItemDto[]
): LibraryAttachmentRow[] {
  const rows: LibraryAttachmentRow[] = [];
  for (const template of templates) {
    for (const file of template.materials ?? []) {
      if (file.poolFile) continue;
      rows.push({
        ...file,
        templateId: template.id,
        templateTitle: template.title,
        poolFile: false,
      });
    }
  }
  return rows.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

export function filterTemplatesForSearch(
  templates: MaterialLibraryItemDto[],
  query: string
): MaterialLibraryItemDto[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((t) => {
    const inTitle = t.title.toLowerCase().includes(q);
    const inDesc = (t.description ?? "").toLowerCase().includes(q);
    const inModule = (t.moduleTag ?? "").toLowerCase().includes(q);
    const inFiles = (t.materials ?? []).some((f) =>
      f.fileName.toLowerCase().includes(q)
    );
    return inTitle || inDesc || inModule || inFiles;
  });
}

export function filterAttachmentsForSearch(
  rows: LibraryAttachmentRow[],
  query: string
): LibraryAttachmentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.fileName.toLowerCase().includes(q) ||
      r.templateTitle.toLowerCase().includes(q)
  );
}
