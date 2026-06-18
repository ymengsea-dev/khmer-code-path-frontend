"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileUp, Layers, Loader2, Plus, FileText, Presentation } from "lucide-react";
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
import type { ClassSummary } from "@/lib/types/class-api";
import type {
  MaterialLibraryConfigDto,
  MaterialLibraryItemDto,
} from "@/lib/types/lesson-api";
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
  const [libraryConfig, setLibraryConfig] =
    useState<MaterialLibraryConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MaterialLibraryItemDto[]>([]);
  const [poolFiles, setPoolFiles] = useState<LibraryMaterialSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const viewIds = useMemo(
    () => libraryConfig?.views.map((v) => v.id) ?? [],
    [libraryConfig],
  );
  const contentTab = resolveContentTab(get(QueryKey.contentTab), viewIds);
  const filesTabId =
    libraryConfig?.views.find((v) => v.id === "files")?.id ?? "files";
  const templatesTabId =
    libraryConfig?.views.find((v) => v.id === "templates")?.id ?? "templates";
  const defaultTabId = viewIds[0] ?? "all";
  const activeView = libraryConfig?.views.find((v) => v.id === contentTab);
  const searchPlaceholder =
    activeView?.searchPlaceholder ?? activeView?.label ?? "Search…";
  const [assignTemplate, setAssignTemplate] =
    useState<MaterialLibraryItemDto | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(
    null,
  );
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null);

  const filePoolLabel = libraryConfig?.filePoolLabel ?? "Stored files";

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

  const loadConfig = useCallback(async () => {
    setConfigError(null);
    try {
      const config = await lessonService.getLibraryConfig();
      setLibraryConfig(config);
    } catch {
      setLibraryConfig(null);
      setConfigError("Could not load library settings from the server.");
    }
  }, []);

  useEffect(() => {
    if (roleLoaded && (role === "teacher" || role === "admin")) {
      void loadConfig();
      void loadLibrary();
    } else if (roleLoaded) {
      setLoading(false);
    }
  }, [roleLoaded, role, loadConfig, loadLibrary]);

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
    if (!libraryConfig?.createDefaults) {
      setMessage("Library settings are not loaded yet.");
      return;
    }
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

  const handleAssign = async (classId: number, className: string) => {
    if (!assignTemplate) return;
    setAssigning(true);
    try {
      await lessonService.assignLibraryToClass(assignTemplate.id, classId);
      setMessage(
        `"${assignTemplate.title}" added to ${className}. Students can open the lesson and download attached files.`,
      );
      setAssignTemplate(null);
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

  if (configError || !libraryConfig?.views.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          {configError ?? "Library configuration is unavailable."}
        </p>
        <Button size="sm" variant="outline" onClick={() => void loadConfig()}>
          Retry
        </Button>
      </div>
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
        onOpenChange={(open) => !open && setAssignTemplate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to class</DialogTitle>
            <DialogDescription>
              Creates a lesson in the class with this template&apos;s notes and{" "}
              {assignTemplate?.assetCount ?? 0} attached file
              {(assignTemplate?.assetCount ?? 0) === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>
          {classesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teacherClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No classes found. Create a class first.
            </p>
          ) : (
            <ul className="grid gap-2 max-h-60 overflow-y-auto">
              {teacherClasses.map((cls) => (
                <li key={cls.id}>
                  <button
                    type="button"
                    disabled={assigning}
                    className={cn(
                      glassBtnSubtleClass,
                      "w-full text-left h-auto min-h-10 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                    )}
                    onClick={() => void handleAssign(cls.id, cls.name)}
                  >
                    {cls.name}
                    {cls.code ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({cls.code})
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTemplate(null)}>
              Cancel
            </Button>
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
