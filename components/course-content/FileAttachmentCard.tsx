"use client";

import { FileSpreadsheet, FileText, Loader2, Pencil, Presentation, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LibraryAttachmentRow } from "@/lib/course-content/library-tabs";

function fileIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) return Presentation;
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return FileSpreadsheet;
  return FileText;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileAttachmentCardProps {
  file: LibraryAttachmentRow;
  deleting?: boolean;
  onOpenTemplate?: () => void;
  onDelete: () => void;
}

export function FileAttachmentCard({
  file,
  deleting,
  onOpenTemplate,
  onDelete,
}: FileAttachmentCardProps) {
  const Icon = fileIcon(file.fileName);

  return (
    <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden">
      <CardContent className="p-4 flex gap-3">
        <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{file.fileName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatBytes(file.fileSizeBytes)}
            {file.poolFile ? (
              <span className="mx-1">· Library storage</span>
            ) : (
              <>
                <span className="mx-1">·</span>
                Template: {file.templateTitle}
              </>
            )}
          </p>
          <div className="flex gap-2 mt-3">
            {onOpenTemplate ? (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenTemplate}>
                <Pencil className="h-3 w-3 mr-1" />
                Open template
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              disabled={deleting}
              aria-label={`Delete ${file.fileName}`}
              onClick={onDelete}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
