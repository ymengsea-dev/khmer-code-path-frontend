"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PenSquare,
  Trash2,
} from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  GlassInput,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 30_000;
const EDITOR_ID = "course-content-body-editor";

const glassEditorPanelStyle = {
  background: "var(--glass-bg-subtle)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
} as const;

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
    [templateId, title, moduleTag, bodyHtml, onSaved],
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
      <div className="flex flex-1 items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saveStatus = saving ? "saving" : savedFlash && !dirty ? "saved" : "idle";

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden scrollbar-hide">
      <main
        className="relative flex flex-1 flex-col min-h-0 overflow-hidden rounded-2xl"
        style={glassEditorPanelStyle}
      >
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
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Topic label (optional)
                </span>
                <GlassInput
                  className="h-10 text-sm"
                  value={moduleTag}
                  disabled={saving}
                  placeholder="e.g. Week 3 — Sorting"
                  onChange={(e) => {
                    setModuleTag(e.target.value);
                    markDirty();
                  }}
                />
              </label>
              <span
                className="inline-flex items-center h-10 px-3 rounded-xl text-[11px] font-semibold text-muted-foreground shrink-0"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                }}
              >
                {assetCount} file{assetCount === 1 ? "" : "s"} attached
              </span>
            </div>
          }
          toolbar={
            <>
              <GlassButton
                subtle
                className={cn(glassBtnSubtleClass, "h-8 px-3 text-xs gap-1.5 shrink-0")}
                disabled={saving}
                onClick={() => void handleBack()}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Content Management</span>
              </GlassButton>
              <div className="flex-1 min-w-0" />
              <GlassButton
                subtle
                className={cn(
                  glassBtnSubtleClass,
                  "h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive",
                )}
                disabled={saving || deleting}
                aria-label="Delete template"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </GlassButton>
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

        <button
          type="button"
          disabled={saving}
          onClick={() => void persist(false)}
          className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={
            saveStatus === "saved"
              ? {
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  color: "#16a34a",
                }
              : {
                  background: "#305FC9",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(48,95,201,0.25)",
                }
          }
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveStatus === "saved" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <PenSquare className="h-3.5 w-3.5" />
          )}
          <span>
            {saving ? "Saving" : saveStatus === "saved" ? "Saved" : "Save"}
          </span>
        </button>

        {(saveError || (dirty && !saving)) && (
          <p
            className="absolute bottom-4 left-4 right-28 z-10 text-[11px] text-muted-foreground rounded-xl px-3 py-2 truncate"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              border: "1px solid var(--glass-border-color)",
            }}
          >
            {saveError ??
              "Unsaved · auto-saves every 30s · press Ctrl+S to save now"}
          </p>
        )}
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md glass-modal">
          <DialogHeader>
            <DialogTitle>Delete this template?</DialogTitle>
            <DialogDescription>
              This removes the template and all uploaded files from your
              library. Lessons already assigned to classes are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
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
