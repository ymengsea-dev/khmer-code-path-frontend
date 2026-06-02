"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileUp,
  FolderOpen,
  Loader2,
  Monitor,
  Paperclip,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { lessonService } from "@/lib/services/lesson-service";
import type { LibraryMaterialSummaryDto } from "@/lib/types/lesson-api";
import type { LibraryAttachmentRow } from "@/lib/course-content/library-tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AttachSource = "library" | "computer";

interface TemplateFilesPanelProps {
  templateId: number;
  uploadAccept?: string;
  /** Standalone files from Course Content Library storage (not other templates). */
  poolFiles: LibraryAttachmentRow[];
  disabled?: boolean;
  onMaterialsChanged?: () => void;
}

/** Attach lesson files from the rich text editor toolbar (dropdown). */
export function TemplateFilesPanel({
  templateId,
  uploadAccept = "",
  poolFiles,
  disabled = false,
  onMaterialsChanged,
}: TemplateFilesPanelProps) {
  const { confirm } = useConfirm();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<AttachSource>("computer");
  const [materials, setMaterials] = useState<LibraryMaterialSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await lessonService.listLibraryMaterials(templateId);
      setMaterials(list);
    } catch {
      setMaterials([]);
      setError("Could not load files.");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    if (open) void loadMaterials();
  }, [open, loadMaterials]);

  const pickableFromLibrary = useMemo(() => {
    const onTemplateNames = new Set(materials.map((m) => m.fileName));
    return poolFiles.filter((f) => !onTemplateNames.has(f.fileName));
  }, [poolFiles, materials]);

  const toggleLibraryPick = (id: number) => {
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleUploadFromComputer = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      await lessonService.uploadLibraryMaterials(templateId, Array.from(files));
      await loadMaterials();
      onMaterialsChanged?.();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Upload failed. Use PDF, PPTX, or DOCX (max 50MB, up to 10 files)."
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const handleLinkFromLibrary = async () => {
    if (selectedLibraryIds.length === 0) {
      setError("Select at least one file.");
      return;
    }
    setLinking(true);
    setError(null);
    try {
      await lessonService.linkLibraryMaterials(templateId, selectedLibraryIds);
      setSelectedLibraryIds([]);
      await loadMaterials();
      onMaterialsChanged?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not attach selected files."));
    } finally {
      setLinking(false);
    }
  };

  const handleDelete = async (materialId: number) => {
    const ok = await confirm("Remove this file from the template?", {
      title: "Remove File",
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    setDeletingId(materialId);
    setError(null);
    try {
      await lessonService.deleteLibraryMaterial(templateId, materialId);
      await loadMaterials();
      onMaterialsChanged?.();
    } catch {
      setError("Could not delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "h-8 gap-1 shrink-0 px-2 rounded-md inline-flex items-center outline-none",
          "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
          materials.length > 0 && "text-foreground"
        )}
        title="Attach files"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Paperclip className="h-3.5 w-3.5" />
        <span className="text-[12px] font-medium hidden sm:inline">Attach</span>
        {materials.length > 0 ? (
          <span className="text-[10px] font-bold tabular-nums rounded-full bg-violet-600/90 text-white min-w-[1.125rem] h-[1.125rem] inline-flex items-center justify-center px-1">
            {materials.length}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[min(100vw-2rem,22rem)] p-0 rounded-xl overflow-hidden"
      >
        <div className="px-3 py-2.5 border-b border-slate-200/80 dark:border-zinc-800">
          <p className="text-xs font-bold text-foreground">Lesson files</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            PDF, PPTX, or DOCX from your computer or the library
          </p>
        </div>

        <div className="flex gap-1 p-2 border-b border-slate-200/80 dark:border-zinc-800">
          <Button
            type="button"
            size="sm"
            variant={source === "computer" ? "default" : "outline"}
            className="h-7 flex-1 gap-1 text-[11px]"
            disabled={disabled}
            onClick={() => setSource("computer")}
          >
            <Monitor className="h-3 w-3" />
            Computer
          </Button>
          <Button
            type="button"
            size="sm"
            variant={source === "library" ? "default" : "outline"}
            className="h-7 flex-1 gap-1 text-[11px]"
            disabled={disabled}
            onClick={() => setSource("library")}
          >
            <FolderOpen className="h-3 w-3" />
            Library
          </Button>
        </div>

        <div className="p-2 max-h-44 overflow-y-auto">
          {source === "computer" ? (
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center gap-1.5 h-9 rounded-md border border-dashed border-input",
                "text-xs font-semibold hover:bg-accent",
                (disabled || uploading) && "opacity-50 pointer-events-none"
              )}
            >
              <input
                type="file"
                className="hidden"
                multiple
                accept={uploadAccept}
                disabled={disabled || uploading}
                onChange={(e) => {
                  void handleUploadFromComputer(e.target.files);
                  e.target.value = "";
                }}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Choose files
            </label>
          ) : pickableFromLibrary.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-1 py-2">
              No stored library files to attach. Upload files from the Course Content Library
              page or use Computer.
            </p>
          ) : (
            <div className="space-y-2">
              <ul className="rounded-md border border-slate-200/80 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 max-h-28 overflow-y-auto">
                {pickableFromLibrary.map((file) => (
                  <li key={file.id}>
                    <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                      <input
                        type="checkbox"
                        className="rounded border-input h-3.5 w-3.5"
                        checked={selectedLibraryIds.includes(file.id)}
                        disabled={disabled || linking}
                        onChange={() => toggleLibraryPick(file.id)}
                      />
                      <span className="flex-1 min-w-0 text-[11px]">
                        <span className="font-medium block truncate">{file.fileName}</span>
                        <span className="text-muted-foreground truncate block">
                          Library storage
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                disabled={disabled || linking || selectedLibraryIds.length === 0}
                onClick={() => void handleLinkFromLibrary()}
              >
                {linking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                )}
                Attach selected ({selectedLibraryIds.length})
              </Button>
            </div>
          )}
        </div>

        {error ? (
          <p className="px-3 pb-2 text-[11px] text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <div className="border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            On this template ({loading ? "…" : materials.length})
          </p>
          {loading ? (
            <div className="flex py-3 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length === 0 ? (
            <p className="px-3 pb-3 text-[11px] text-muted-foreground">No files yet.</p>
          ) : (
            <ul className="max-h-32 overflow-y-auto divide-y divide-slate-200/80 dark:divide-zinc-800">
              {materials.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
                >
                  <span className="flex-1 min-w-0 font-medium truncate">{file.fileName}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {formatBytes(file.fileSizeBytes)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive"
                    disabled={disabled || deletingId === file.id}
                    aria-label={`Remove ${file.fileName}`}
                    onClick={() => void handleDelete(file.id)}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
