"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Plus,
  FileUp,
  Search,
  Link2,
  Pencil,
  Presentation,
  Video,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authService } from "@/lib/services/auth-service";
import { classService } from "@/lib/services/class-service";
import { lessonService } from "@/lib/services/lesson-service";
import type { UserProfile } from "@/lib/auth/backend-api";
import type { ClassSummary } from "@/lib/types/class-api";
import type {
  LibraryIconTypeDto,
  MaterialLibraryItemDto,
} from "@/lib/types/lesson-api";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { COURSE_CONTENT_MODULES } from "@/data/course-content";

function TemplateIcon({ icon }: { icon: LibraryIconTypeDto }) {
  const Icon = icon === "VIDEO" ? Video : Presentation;
  return <Icon className="h-10 w-10 text-white/90" />;
}

export function CourseContentView() {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const moduleParam = get(QueryKey.contentModule);
  const moduleFilter = useMemo(() => {
    if (!moduleParam) return "All Modules";
    try {
      return decodeURIComponent(moduleParam);
    } catch {
      return moduleParam;
    }
  }, [moduleParam]);

  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [templates, setTemplates] = useState<MaterialLibraryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTemplate, setAssignTemplate] = useState<MaterialLibraryItemDto | null>(
    null
  );
  const [teacherClasses, setTeacherClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const moduleTag =
        moduleFilter === "All Modules" ? undefined : moduleFilter;
      const data = await lessonService.listLibrary({
        search: searchQuery.trim() || undefined,
        moduleTag,
      });
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, moduleFilter]);

  useEffect(() => {
    async function loadRole() {
      try {
        const response = await authService.me();
        const user = response?.data as UserProfile | undefined;
        const r = user?.role?.toLowerCase();
        if (r === "admin" || r === "teacher" || r === "student") {
          setRole(r);
        }
      } catch {
        /* default */
      } finally {
        setRoleLoaded(true);
      }
    }
    void loadRole();
  }, []);

  useEffect(() => {
    if (roleLoaded && (role === "teacher" || role === "admin")) {
      void loadLibrary();
    } else if (roleLoaded) {
      setLoading(false);
    }
  }, [roleLoaded, role, loadLibrary]);

  const setModuleFilter = useCallback(
    (value: string) => {
      setParams({
        [QueryKey.contentModule]:
          value === "All Modules" ? null : encodeURIComponent(value),
      });
    },
    [setParams]
  );

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
    setCreating(true);
    try {
      await lessonService.createLibraryItem({
        title: "New Lesson Template",
        moduleTag: "Fundamentals",
        description: "Draft template — add materials and assign to a class.",
        iconType: "SLIDES",
        gradient: "from-violet-800 to-violet-600",
      });
      await loadLibrary();
    } catch {
      setMessage("Could not create template.");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (classId: number, className: string) => {
    if (!assignTemplate) return;
    setAssigning(true);
    try {
      await lessonService.assignLibraryToClass(assignTemplate.id, classId);
      setMessage(`"${assignTemplate.title}" added to ${className}. Enrolled students can study it.`);
      setAssignTemplate(null);
    } catch {
      setMessage("Assign failed. Check that you teach this class.");
    } finally {
      setAssigning(false);
    }
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
          Course content library is available to teachers only.
        </p>
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
            Reusable lesson templates — assign to a class so enrolled students can study.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = ".pdf,.pptx,.docx";
              input.onchange = async () => {
                if (!input.files?.length || templates.length === 0) {
                  setMessage("Create a template first, then upload files to it.");
                  return;
                }
                try {
                  await lessonService.uploadLibraryMaterials(
                    templates[0].id,
                    Array.from(input.files)
                  );
                  setMessage("Materials uploaded to your latest template.");
                  await loadLibrary();
                } catch {
                  setMessage("Upload failed.");
                }
              };
              input.click();
            }}
          >
            <FileUp className="h-4 w-4 mr-1.5" />
            Upload to latest template
          </Button>
          <Button size="sm" disabled={creating} onClick={() => void handleCreateTemplate()}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Create template
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {message && (
          <p className="text-sm text-muted-foreground rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-2">
            {message}
          </p>
        )}

        <Card className="p-4 border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm min-w-[160px]"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              {COURSE_CONTENT_MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No templates yet. Create one and assign it to a class.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="overflow-hidden border-slate-200/80 dark:border-zinc-800 shadow-2xs p-0 gap-0"
              >
                <div
                  className={cn(
                    "h-32 flex items-center justify-center bg-gradient-to-br",
                    template.gradient
                  )}
                >
                  <TemplateIcon icon={template.iconType} />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground">{template.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-medium text-muted-foreground">
                    <span>Module: {template.moduleTag ?? "—"}</span>
                    <span>•</span>
                    <span>{template.assetCount} assets</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    {template.description ?? ""}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-[2]"
                      onClick={() => void openAssignDialog(template)}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Assign to Class
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 px-2">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              Enrolled students in the class can open and study this lesson.
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
    </div>
  );
}
