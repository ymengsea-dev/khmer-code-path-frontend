"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileUp,
  Layers,
  Loader2,
  Plus,
  FileText,
  Presentation,
  Video,
  Users,
  Check,
  CornerDownRight,
} from "lucide-react";
import {
  GlassSearchInput,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { GlassButton } from "@/components/ui/glass-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-error";
import { classService } from "@/lib/services/class-service";
import { lessonService } from "@/lib/services/lesson-service";
import { MATERIAL_LIBRARY_UI } from "@/lib/lms-ui/material-library";
import type { ClassSummary } from "@/lib/types/class-api";
import type { MaterialLibraryItemDto } from "@/lib/types/lesson-api";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import {
  filterAttachmentsForSearch,
  filterTemplatesForSearch,
  poolFilesToAttachmentRows,
  resolveContentTab,
  type LibraryAttachmentRow,
} from "@/lib/course-content/library-tabs";
import type { LibraryMaterialSummaryDto } from "@/lib/types/lesson-api";
import { CourseContentEditor } from "@/components/course-content/CourseContentEditor";
import { LibraryFileUploadDialog } from "@/components/course-content/LibraryFileUploadDialog";
import { TemplateLibraryCard } from "@/components/course-content/TemplateLibraryCard";
import { FileAttachmentCard } from "@/components/course-content/FileAttachmentCard";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion";

const glassPanelStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
} as const;

export function CourseContentView() {
  const { get, setParams } = useQueryParams();
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const contentIdParam = get(QueryKey.contentId);
  const editingId = contentIdParam ? Number(contentIdParam) : NaN;
  const isEditing = Number.isFinite(editingId) && editingId > 0;

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ??
    "student";
  const roleLoaded = !userLoading;
  const libraryConfig = MATERIAL_LIBRARY_UI;
  const [templates, setTemplates] = useState<MaterialLibraryItemDto[]>([]);
  const [poolFiles, setPoolFiles] = useState<LibraryMaterialSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const viewIds = useMemo(
    () => libraryConfig.views.map((v) => v.id),
    [libraryConfig.views],
  );
  const contentTab = resolveContentTab(get(QueryKey.contentTab), viewIds);
  const filesTabId =
    libraryConfig.views.find((v) => v.id === "files")?.id ?? "files";
  const templatesTabId =
    libraryConfig.views.find((v) => v.id === "templates")?.id ?? "templates";
  const defaultTabId = viewIds[0] ?? "all";
  const activeView = libraryConfig.views.find((v) => v.id === contentTab);
  const searchPlaceholder = activeView?.searchPlaceholder ?? "Search…";
  const [assignTemplate, setAssignTemplate] =
    useState<MaterialLibraryItemDto | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(
    null,
  );
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null);

  const filePoolLabel = libraryConfig.filePoolLabel;

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const search = searchQuery.trim() || undefined;
      const [data, files] = await Promise.all([
        lessonService.listLibrary({ search }),
        lessonService.listLibraryPoolFiles(search),
      ]);
      setTemplates(data);
      setPoolFiles(files);
    } catch {
      setTemplates([]);
      setPoolFiles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const filteredTemplates = useMemo(
    () => filterTemplatesForSearch(templates, searchQuery),
    [templates, searchQuery],
  );

  const poolAttachmentRows = useMemo(
    () => poolFilesToAttachmentRows(poolFiles, filePoolLabel),
    [poolFiles, filePoolLabel],
  );

  const filteredPoolFiles = useMemo(
    () => filterAttachmentsForSearch(poolAttachmentRows, searchQuery),
    [poolAttachmentRows, searchQuery],
  );

  useEffect(() => {
    if (roleLoaded && (role === "teacher" || role === "admin")) {
      void loadLibrary();
    } else if (roleLoaded) {
      setLoading(false);
    }
  }, [roleLoaded, role, loadLibrary]);

  const setContentTab = useCallback(
    (tabId: string) => {
      setParams({
        [QueryKey.contentTab]: tabId === defaultTabId ? null : tabId,
      });
    },
    [setParams, defaultTabId],
  );

  const openEditor = useCallback(
    (id: number) => {
      setParams({ [QueryKey.contentId]: String(id) });
    },
    [setParams],
  );

  const closeEditor = useCallback(() => {
    setParams({ [QueryKey.contentId]: null });
  }, [setParams]);

  const openAssignDialog = async (template: MaterialLibraryItemDto) => {
    setAssignTemplate(template);
    setSelectedClassId(null);
    setClassesLoading(true);
    try {
      const page = await classService.listClasses({ size: 50 });
      setTeacherClasses(page.items ?? []);
    } catch {
      setTeacherClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    setCreating(true);
    try {
      const d = libraryConfig.createDefaults;
      const created = await lessonService.createLibraryItem({
        title: d.title,
        iconType: d.iconType,
        gradient: d.gradient,
      });
      openEditor(created.id);
    } catch {
      setMessage("Could not create template.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (template: MaterialLibraryItemDto) => {
    const ok = await confirm(
      `Delete "${template.title}" and all its files? This cannot be undone.`,
      {
        title: "Delete Template",
        confirmLabel: "Delete",
        variant: "destructive",
      },
    );
    if (!ok) {
      return;
    }
    setDeletingTemplateId(template.id);
    try {
      await lessonService.deleteLibraryItem(template.id);
      if (editingId === template.id) closeEditor();
      setMessage(`"${template.title}" deleted.`);
      await loadLibrary();
    } catch {
      setMessage("Could not delete template.");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleDeleteFile = async (file: LibraryAttachmentRow) => {
    const ok = await confirm(`Remove "${file.fileName}" from the library?`, {
      title: "Remove File",
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    const key = `${file.templateId}-${file.id}`;
    setDeletingFileKey(key);
    try {
      if (file.poolFile) {
        await lessonService.deleteLibraryPoolFile(file.id);
      } else {
        await lessonService.deleteLibraryMaterial(file.templateId, file.id);
      }
      setMessage(`"${file.fileName}" removed.`);
      await loadLibrary();
    } catch {
      setMessage("Could not delete file.");
    } finally {
      setDeletingFileKey(null);
    }
  };

  const closeAssign = () => {
    setAssignTemplate(null);
    setSelectedClassId(null);
  };

  const handleAssign = async () => {
    if (!assignTemplate || selectedClassId == null) return;
    const target = teacherClasses.find((c) => c.id === selectedClassId);
    if (!target) return;
    setAssigning(true);
    try {
      await lessonService.assignLibraryToClass(assignTemplate.id, target.id);
      setMessage(
        `"${assignTemplate.title}" added to ${target.name}. Students can open the lesson and download attached files.`,
      );
      closeAssign();
    } catch {
      setMessage("Assign failed. Check that you teach this class.");
    } finally {
      setAssigning(false);
    }
  };

  const headerActions = (
    <>
      <GlassButton
        subtle
        className={cn(glassBtnSubtleClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
        onClick={() => setUploadDialogOpen(true)}
      >
        <FileUp className="h-3.5 w-3.5" />
        Upload files
      </GlassButton>
      <GlassButton
        primary
        className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
        disabled={creating}
        onClick={() => void handleCreateTemplate()}
      >
        {creating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        New template
      </GlassButton>
    </>
  );

  const totalAttachedFiles = useMemo(
    () => templates.reduce((sum, t) => sum + (t.assetCount ?? 0), 0),
    [templates],
  );

  const summaryStats = useMemo(
    () => [
      {
        label: "Templates",
        value: String(templates.length),
        sub: "lesson builds",
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
      },
      {
        label: filePoolLabel,
        value: String(poolFiles.length),
        sub: "in library pool",
        color: "#305FC9",
        bg: "rgba(48,95,201,0.08)",
      },
      {
        label: "Attached",
        value: String(totalAttachedFiles),
        sub: "on templates",
        color: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
      },
    ],
    [templates.length, poolFiles.length, totalAttachedFiles, filePoolLabel],
  );

  const renderTemplatesGrid = (
    items: MaterialLibraryItemDto[],
    empty: string,
  ) => {
    if (items.length === 0) {
      return (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={glassPanelStyle}
        >
          <Presentation className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      );
    }
    return (
      <BouncyStagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((template) => (
          <BouncyStaggerItem key={template.id} enter="simple">
            <TemplateLibraryCard
              template={template}
              deleting={deletingTemplateId === template.id}
              onAssign={() => void openAssignDialog(template)}
              onEdit={() => openEditor(template.id)}
              onDelete={() => void handleDeleteTemplate(template)}
            />
          </BouncyStaggerItem>
        ))}
      </BouncyStagger>
    );
  };

  const renderFilesGrid = (items: LibraryAttachmentRow[], empty: string) => {
    if (items.length === 0) {
      return (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={glassPanelStyle}
        >
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      );
    }
    return (
      <BouncyStagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((file) => (
          <BouncyStaggerItem key={`${file.templateId}-${file.id}`} enter="simple">
            <FileAttachmentCard
              file={file}
              deleting={deletingFileKey === `${file.templateId}-${file.id}`}
              onOpenTemplate={
                file.poolFile ? undefined : () => openEditor(file.templateId)
              }
              onDelete={() => void handleDeleteFile(file)}
            />
          </BouncyStaggerItem>
        ))}
      </BouncyStagger>
    );
  };

  if (!roleLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== "teacher" && role !== "admin") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center rounded-2xl mx-auto max-w-md"
        style={glassPanelStyle}
      >
        <Layers className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This workspace is for teachers only. Open a class from Classes to view
          your lessons.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <CourseContentEditor
        templateId={editingId}
        onBack={closeEditor}
        onSaved={() => void loadLibrary()}
        onDeleted={() => {
          closeEditor();
          void loadLibrary();
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shrink-0">
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Upload files, build lesson templates in the editor, attach materials,
            then assign templates to your classes.
          </p>
          <div className="flex flex-wrap gap-2 shrink-0">{headerActions}</div>
        </div>

        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={glassPanelStyle}
              >
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  {stat.value}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center shrink-0">
          <GlassSearchInput
            containerClassName="flex-1 max-w-none lg:max-w-md"
            className="h-11"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div
            className="flex gap-1 p-1 rounded-2xl overflow-x-auto shrink-0 lg:ml-auto"
            style={glassPanelStyle}
          >
            {libraryConfig.views.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setContentTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-xl transition-colors",
                  contentTab === tab.id
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                {tab.label}
                {tab.id === templatesTabId && templates.length > 0 ? (
                  <span className="ml-1.5 opacity-80">({templates.length})</span>
                ) : null}
                {tab.id === filesTabId && poolFiles.length > 0 ? (
                  <span className="ml-1.5 opacity-80">({poolFiles.length})</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p
            className="text-sm text-muted-foreground rounded-2xl px-4 py-3 shrink-0"
            style={glassPanelStyle}
          >
            {message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contentTab === templatesTabId ? (
          renderTemplatesGrid(
            filteredTemplates,
            "No templates yet. Create one to build lesson content.",
          )
        ) : contentTab === filesTabId ? (
          renderFilesGrid(
            filteredPoolFiles,
            "No stored files yet. Use Upload files to add PDF, DOCX, or PPTX to your library.",
          )
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-extrabold text-foreground mb-1">Templates</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Reusable lesson builds — notes, structure, and metadata.
              </p>
              {renderTemplatesGrid(
                filteredTemplates,
                "No templates yet. Create one to get started.",
              )}
            </section>
            <section>
              <h2 className="text-sm font-extrabold text-foreground mb-1">
                File attachments
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                PDF, DOCX, and PPTX in your library — attach to templates from
                the editor, then copy to class lessons when assigned.
              </p>
              {renderFilesGrid(
                filteredPoolFiles,
                "No stored files yet. Use Upload files above.",
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(assignTemplate)}
        onOpenChange={(open) => !open && closeAssign()}
      >
        <DialogContent className="glass-modal-solid sm:max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-3 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">
              Assign template
            </DialogTitle>
            {/* Source: the template being handed off */}
            <div
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br p-3 pr-4 text-white shadow-sm",
                assignTemplate?.gradient?.startsWith("from-")
                  ? assignTemplate.gradient
                  : "from-indigo-500 to-purple-600",
              )}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                {assignTemplate?.iconType === "VIDEO" ? (
                  <Video className="size-5 text-white" />
                ) : (
                  <Presentation className="size-5 text-white" />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold leading-tight drop-shadow-sm">
                  {assignTemplate?.title ?? "Template"}
                </h2>
                <p className="mt-0.5 truncate text-[11px] font-medium text-white/85">
                  {assignTemplate?.moduleTag?.trim()
                    ? `${assignTemplate.moduleTag.trim()} · `
                    : ""}
                  {assignTemplate?.assetCount ?? 0} file
                  {(assignTemplate?.assetCount ?? 0) === 1 ? "" : "s"} attached
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Connector: source → destination */}
          <div className="flex items-center gap-2 px-6 pb-2">
            <CornerDownRight className="size-3.5 text-muted-foreground" />
            <DialogDescription className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Add as a lesson in
            </DialogDescription>
          </div>

          {/* Destinations: the teacher's classes */}
          {classesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : teacherClasses.length === 0 ? (
            <div className="mx-6 mb-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm font-medium">No classes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a class before assigning this template.
              </p>
            </div>
          ) : (
            <ul className="grid max-h-64 gap-1 overflow-y-auto px-4 py-1">
              {teacherClasses.map((cls) => {
                const selected = selectedClassId === cls.id;
                return (
                <li key={cls.id}>
                  <button
                    type="button"
                    disabled={assigning}
                    aria-pressed={selected}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
                      selected
                        ? "border-violet-400 bg-violet-50 dark:border-violet-500/50 dark:bg-violet-500/10"
                        : "border-transparent hover:border-violet-300/60 hover:bg-violet-50 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10",
                    )}
                  >
                    <span
                      className={cn(
                        "h-9 w-1.5 shrink-0 rounded-full bg-linear-to-b",
                        cls.cardGradient?.startsWith("from-")
                          ? cls.cardGradient
                          : "from-slate-400 to-slate-600",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {cls.name}
                        </span>
                        {cls.code ? (
                          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {cls.code}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Users className="size-3 shrink-0" />
                        {cls.enrolledCount} student
                        {cls.enrolledCount === 1 ? "" : "s"}
                        {cls.semesterLabel ? (
                          <span className="truncate opacity-60">
                            · {cls.semesterLabel}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-muted-foreground/30 text-transparent group-hover:border-violet-400",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>
          )}

          <DialogFooter className="mt-2 gap-2 border-t border-border/60 px-6 py-3 sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={assigning}
              onClick={closeAssign}
            >
              Cancel
            </Button>
            <button
              type="button"
              disabled={selectedClassId == null || assigning}
              onClick={() => void handleAssign()}
              className={cn(
                glassBtnPrimaryClass,
                "h-9.5 gap-2 px-4 text-sm font-semibold disabled:opacity-50",
              )}
            >
              {assigning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" strokeWidth={2.5} />
              )}
              Assign to class
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LibraryFileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        uploadAccept={libraryConfig.uploadAccept}
        onUploaded={() => {
          setMessage("Files stored in your library.");
          void loadLibrary();
        }}
      />
    </div>
  );
}
