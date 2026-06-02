"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Loader2,
  FileUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

export function CourseContentView() {
  const { get, setParams } = useQueryParams();
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const contentIdParam = get(QueryKey.contentId);
  const editingId = contentIdParam ? Number(contentIdParam) : NaN;
  const isEditing = Number.isFinite(editingId) && editingId > 0;

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ?? "student";
  const roleLoaded = !userLoading;
  const [libraryConfig, setLibraryConfig] = useState<MaterialLibraryConfigDto | null>(
    null
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MaterialLibraryItemDto[]>([]);
  const [poolFiles, setPoolFiles] = useState<LibraryMaterialSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const viewIds = useMemo(
    () => libraryConfig?.views.map((v) => v.id) ?? [],
    [libraryConfig]
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
  const [assignTemplate, setAssignTemplate] = useState<MaterialLibraryItemDto | null>(
    null
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
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
    [templates, searchQuery]
  );

  const poolAttachmentRows = useMemo(
    () => poolFilesToAttachmentRows(poolFiles, filePoolLabel),
    [poolFiles, filePoolLabel]
  );

  const filteredPoolFiles = useMemo(
    () => filterAttachmentsForSearch(poolAttachmentRows, searchQuery),
    [poolAttachmentRows, searchQuery]
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
    [setParams, defaultTabId]
  );

  const openEditor = useCallback(
    (id: number) => {
      setParams({ [QueryKey.contentId]: String(id) });
    },
    [setParams]
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
      { title: "Delete Template", confirmLabel: "Delete", variant: "destructive" }
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
        `"${assignTemplate.title}" added to ${className}. Students can open the lesson and download attached files.`
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
      <Button
        size="sm"
        variant="outline"
        onClick={() => setUploadDialogOpen(true)}
      >
        <FileUp className="h-4 w-4 mr-1.5" />
        Upload files
      </Button>
      <Button size="sm" disabled={creating} onClick={() => void handleCreateTemplate()}>
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <Plus className="h-4 w-4 mr-1.5" />
        )}
        New template
      </Button>
    </>
  );

  const renderTemplatesGrid = (items: MaterialLibraryItemDto[], empty: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-10">{empty}</p>;
    }
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((template) => (
          <TemplateLibraryCard
            key={template.id}
            template={template}
            deleting={deletingTemplateId === template.id}
            onAssign={() => void openAssignDialog(template)}
            onEdit={() => openEditor(template.id)}
            onDelete={() => void handleDeleteTemplate(template)}
          />
        ))}
      </div>
    );
  };

  const renderFilesGrid = (items: LibraryAttachmentRow[], empty: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-10">{empty}</p>;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((file) => (
          <FileAttachmentCard
            key={`${file.templateId}-${file.id}`}
            file={file}
            deleting={deletingFileKey === `${file.templateId}-${file.id}`}
            onOpenTemplate={
              file.poolFile ? undefined : () => openEditor(file.templateId)
            }
            onDelete={() => void handleDeleteFile(file)}
          />
        ))}
      </div>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <Layers className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This workspace is for teachers only. Open a class from Classes to view your lessons.
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
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/60 dark:border-zinc-800 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Course Content Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload files to your library, build lesson templates in the editor, attach files
            to templates, then assign to a class.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{headerActions}</div>
      </header>

      <div className="shrink-0 px-6 py-3 border-b border-slate-200/60 dark:border-zinc-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-9"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 -mb-px overflow-x-auto shrink-0 sm:ml-auto">
          {libraryConfig.views.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setContentTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
                contentTab === tab.id
                  ? "border-violet-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === templatesTabId && templates.length > 0 ? (
                <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">
                  ({templates.length})
                </span>
              ) : null}
              {tab.id === filesTabId && poolFiles.length > 0 ? (
                <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">
                  ({poolFiles.length})
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {message && (
          <p className="text-sm text-muted-foreground rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-2">
            {message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contentTab === templatesTabId ? (
          renderTemplatesGrid(
            filteredTemplates,
            "No templates yet. Create one to build lesson content."
          )
        ) : contentTab === filesTabId ? (
          renderFilesGrid(
            filteredPoolFiles,
            "No stored files yet. Use Upload files to add PDF, DOCX, or PPTX to your library."
          )
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-sm font-extrabold text-foreground mb-1">Templates</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Reusable lesson builds — notes, structure, and metadata.
              </p>
              {renderTemplatesGrid(
                filteredTemplates,
                "No templates yet. Create one to get started."
              )}
            </section>
            <section>
              <h2 className="text-sm font-extrabold text-foreground mb-1">
                File attachments
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                PDF, DOCX, and PPTX in your library — attach to templates from the editor,
                then copy to class lessons when assigned.
              </p>
              {renderFilesGrid(
                filteredPoolFiles,
                "No stored files yet. Use Upload files above."
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
                    className="w-full text-left rounded-lg border border-slate-200/80 dark:border-zinc-800 px-3 py-2.5 text-sm font-medium hover:bg-slate-100/80 dark:hover:bg-zinc-900/50 transition-colors disabled:opacity-50"
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
