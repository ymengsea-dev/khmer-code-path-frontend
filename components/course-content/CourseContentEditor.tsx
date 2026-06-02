"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PenSquare,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextDocumentEditor } from "@/components/editor/RichTextDocumentEditor";
import { TemplateFilesPanel } from "@/components/course-content/TemplateFilesPanel";
import {
  poolFilesToAttachmentRows,
  type LibraryAttachmentRow,
} from "@/lib/course-content/library-tabs";
import { lessonService } from "@/lib/services/lesson-service";
import type { MaterialLibraryItemDto } from "@/lib/types/lesson-api";
import {
  EMPTY_EDITOR_HTML,
  fromEditorHtml,
  toEditorHtml,
} from "@/lib/editor/html-content";
import { Input } from "@/components/ui/input";

const AUTOSAVE_MS = 30_000;
const EDITOR_ID = "course-content-body-editor";

interface CourseContentEditorProps {
  templateId: number;
  onBack: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function CourseContentEditor({
  templateId,
  onBack,
  onSaved,
  onDeleted,
}: CourseContentEditorProps) {
  const [title, setTitle] = useState("");
  const [moduleTag, setModuleTag] = useState("");
  const [bodyHtml, setBodyHtml] = useState(EMPTY_EDITOR_HTML);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [assetCount, setAssetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadAccept, setUploadAccept] = useState("");
  const [poolFiles, setPoolFiles] = useState<LibraryAttachmentRow[]>([]);
  const [filePoolLabel, setFilePoolLabel] = useState("Stored files");
  const dirtyRef = useRef(false);

  const loadPoolFiles = useCallback(async () => {
    try {
      const files = await lessonService.listLibraryPoolFiles();
      setPoolFiles(poolFilesToAttachmentRows(files, filePoolLabel));
    } catch {
      setPoolFiles([]);
    }
  }, [filePoolLabel]);

  useEffect(() => {
    void lessonService.getLibraryConfig().then((c) => {
      setUploadAccept(c.uploadAccept);
      if (c.filePoolLabel) setFilePoolLabel(c.filePoolLabel);
    });
  }, []);

  useEffect(() => {
    void loadPoolFiles();
  }, [loadPoolFiles]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
    setSavedFlash(false);
  }, []);

  const applyTemplate = useCallback((item: MaterialLibraryItemDto) => {
    setTitle(item.title);
    setModuleTag(item.moduleTag ?? "");
    setBodyHtml(toEditorHtml(item.description));
    setUpdatedAt(item.updatedAt);
    setAssetCount(item.assetCount);
    dirtyRef.current = false;
    setDirty(false);
    setSaveError(null);
    setSavedFlash(false);
  }, []);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const item = await lessonService.getLibraryItem(templateId);
      applyTemplate(item);
    } catch {
      setSaveError("Could not load this template.");
    } finally {
      setLoading(false);
    }
  }, [templateId, applyTemplate]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const persist = useCallback(
    async (silent = false) => {
      if (!dirtyRef.current) return true;
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setSaveError("Title is required.");
        return false;
      }
      setSaving(true);
      setSaveError(null);
      try {
        const updated = await lessonService.updateLibraryItem(templateId, {
          title: trimmedTitle,
          moduleTag: moduleTag.trim() || undefined,
          description: fromEditorHtml(bodyHtml) ?? undefined,
        });
        setUpdatedAt(updated.updatedAt);
        setAssetCount(updated.assetCount);
        dirtyRef.current = false;
        setDirty(false);
        setSavedFlash(true);
        onSaved();
        return true;
      } catch {
        if (!silent) setSaveError("Could not save template.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [templateId, title, moduleTag, bodyHtml, onSaved]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dirtyRef.current) void persist(true);
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, [persist]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void persist(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [persist]);

  const handleBack = async () => {
    if (dirtyRef.current) {
      const ok = await persist(false);
      if (!ok && dirtyRef.current) return;
    }
    onBack();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await lessonService.deleteLibraryItem(templateId);
      setDeleteOpen(false);
      onDeleted();
    } catch {
      setSaveError("Could not delete template.");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#fffef8] dark:bg-[#1c1c1e]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[#fffef8] dark:bg-[#1c1c1e]">
      <RichTextDocumentEditor
        title={title}
        onTitleChange={(v) => {
          setTitle(v);
          markDirty();
        }}
        bodyHtml={bodyHtml}
        onBodyChange={(html) => {
          setBodyHtml(html);
          markDirty();
        }}
        updatedAt={updatedAt}
        titlePlaceholder="Template title"
        bodyPlaceholder="Describe this lesson template…"
        disabled={saving}
        editorId={EDITOR_ID}
        meta={
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-[12px] text-muted-foreground flex-1 min-w-[200px] max-w-sm">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Topic label (optional)
              </span>
              <Input
                className="h-9 text-sm"
                value={moduleTag}
                disabled={saving}
                placeholder="e.g. Week 3 — Sorting"
                onChange={(e) => {
                  setModuleTag(e.target.value);
                  markDirty();
                }}
              />
            </label>
            <p className="text-[11px] text-muted-foreground pb-1">
              {assetCount} file{assetCount === 1 ? "" : "s"} stored · assign to a class to
              publish lesson + files
            </p>
          </div>
        }
        toolbar={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[13px]"
              disabled={saving}
              onClick={() => void handleBack()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={saving || deleting}
              aria-label="Delete template"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[13px] font-medium"
              disabled={saving || !dirty}
              onClick={() => void persist(false)}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : savedFlash && !dirty ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <PenSquare className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5 hidden sm:inline">
                {saving ? "Saving" : savedFlash && !dirty ? "Saved" : "Save"}
              </span>
            </Button>
          </>
        }
        editorToolbarEnd={
          <TemplateFilesPanel
            templateId={templateId}
            uploadAccept={uploadAccept}
            poolFiles={poolFiles}
            disabled={saving}
            onMaterialsChanged={() => {
              void loadTemplate();
              void loadPoolFiles();
              onSaved();
            }}
          />
        }
        className="flex-1 min-h-0"
      />

      {(saveError || (dirty && !saving)) && (
        <p className="shrink-0 px-6 py-2 text-[11px] text-center text-muted-foreground border-t border-black/4">
          {saveError ?? "Unsaved · auto-saves every 30s · press Ctrl+S to save now"}
        </p>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this template?</DialogTitle>
            <DialogDescription>
              This removes the template and all uploaded files from your library. Lessons
              already assigned to classes are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
