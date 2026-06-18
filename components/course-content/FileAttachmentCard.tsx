"use client";

import {
  FileSpreadsheet,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Presentation,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LibraryAttachmentRow } from "@/lib/course-content/library-tabs";
import { cn } from "@/lib/utils";
import { glassBtnSubtleClass } from "@/components/ui/glass-field";

function fileIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) return Presentation;
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return FileSpreadsheet;
  return FileText;
}

function fileGradient(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) {
    return "from-amber-500 to-orange-600";
  }
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    return "from-blue-600 to-sky-700";
  }
  return "from-rose-500 to-pink-600";
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
  const gradient = fileGradient(file.fileName);
  const typeLabel = file.poolFile ? "Library storage" : "On template";

  return (
    <Card
      bouncy={false}
      className="border border-slate-200/80 dark:border-zinc-800/80 hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md flex flex-col overflow-hidden h-full p-0 gap-0"
    >
      <div
        className={cn(
          "h-20 bg-linear-to-br relative overflow-hidden flex items-center justify-center",
          gradient,
        )}
      >
        <div className="absolute inset-0 bg-black/10" />
        <Icon className="w-10 h-10 text-white/30 absolute right-4 bottom-[-6px] rotate-12 scale-150" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge className="bg-black/35 text-white font-bold border-0 backdrop-blur-sm">
            {typeLabel}
          </Badge>
          <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md shrink-0">
            {formatBytes(file.fileSizeBytes)}
          </span>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-foreground truncate">{file.fileName}</p>
          {!file.poolFile ? (
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Template: {file.templateTitle}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1">
              Ready to attach to a lesson template
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {onOpenTemplate ? (
            <Button
              size="sm"
              variant="default"
              className="flex-1 text-xs"
              onClick={onOpenTemplate}
            >
              Open template
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                glassBtnSubtleClass,
                "h-8 w-8 shrink-0 rounded-xl px-0 text-muted-foreground hover:text-foreground",
              )}
              aria-label={`Options for ${file.fileName}`}
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onOpenTemplate ? (
                <DropdownMenuItem onClick={onOpenTemplate}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Open template
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Remove file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
