"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  Loader2,
  UserPlus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lessonService } from "@/lib/services/lesson-service";
import type { ClassSummary } from "@/lib/types/class-api";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";
import { LessonRichContent } from "@/components/lessons/LessonRichContent";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ClassPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSummary: ClassSummary | null;
  description: string;
  semesterLabel: string;
  statusLabel: string;
  canViewRoster: boolean;
  isStudent: boolean;
  onEnterClass: () => void;
  onManageRoster: () => void;
  onAttendance?: () => void;
  onGrades?: () => void;
}

export function ClassPreviewSheet({
  open,
  onOpenChange,
  classSummary,
  description,
  semesterLabel,
  statusLabel,
  canViewRoster,
  isStudent,
  onEnterClass,
  onManageRoster,
  onAttendance,
  onGrades,
}: ClassPreviewSheetProps) {
  const [lessons, setLessons] = useState<LessonSummaryDto[]>([]);
  const [previewLesson, setPreviewLesson] = useState<LessonDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"content" | "materials">("content");

  const loadPreview = useCallback(async () => {
    if (!classSummary) return;
    setLoading(true);
    try {
      const list = await lessonService.listLessons(classSummary.id);
      setLessons(list);
      if (list.length > 0) {
        const detail = await lessonService.getLesson(list[0].id);
        setPreviewLesson(detail);
      } else {
        setPreviewLesson(null);
      }
    } catch {
      setLessons([]);
      setPreviewLesson(null);
    } finally {
      setLoading(false);
    }
  }, [classSummary]);

  useEffect(() => {
    if (open && classSummary) {
      setPreviewTab("content");
      void loadPreview();
    }
  }, [open, classSummary, loadPreview]);

  const selectPreviewLesson = async (lessonId: number) => {
    try {
      const detail = await lessonService.getLesson(lessonId);
      setPreviewLesson(detail);
    } catch {
      setPreviewLesson(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 shrink-0 text-left">
          <SheetTitle className="text-lg font-extrabold pr-8">
            {classSummary?.name ?? "Class"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {classSummary?.code} · {semesterLabel}
          </SheetDescription>
          <div className="space-y-2 text-xs text-muted-foreground mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold">
                {classSummary?.code}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px] font-bold border-0",
                  statusLabel === "Active"
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
                )}
              >
                {statusLabel}
              </Badge>
            </div>
            <p>{semesterLabel}</p>
            <p>{classSummary?.teacherName}</p>
            <p>{classSummary?.enrolledCount} students enrolled</p>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          {description ? (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : previewLesson ? (
            <>
              {lessons.length > 1 ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lesson
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={previewLesson.id}
                    onChange={(e) => void selectPreviewLesson(Number(e.target.value))}
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm font-bold text-foreground">{previewLesson.title}</p>
              )}

              <div className="flex gap-1 border-b border-slate-200/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewTab("content")}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold border-b-2 -mb-px",
                    previewTab === "content"
                      ? "border-violet-500 text-foreground"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  Lessons
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("materials")}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold border-b-2 -mb-px",
                    previewTab === "materials"
                      ? "border-violet-500 text-foreground"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  Materials ({previewLesson.materials.length})
                </button>
              </div>

              {previewTab === "content" ? (
                <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 p-4">
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Lesson notes
                    </span>
                  </div>
                  <LessonRichContent
                    html={previewLesson.description}
                    emptyMessage="No lesson notes have been added yet."
                  />
                </div>
              ) : (
                <ul className="space-y-2">
                  {previewLesson.materials.length === 0 ? (
                    <li className="text-sm text-muted-foreground py-4 text-center">
                      No files attached to this lesson yet.
                    </li>
                  ) : (
                    previewLesson.materials.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 px-3 py-2.5"
                      >
                        <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatBytes(file.fileSizeBytes)}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No lesson content in this class yet. Open the class to see more once your teacher
              adds lessons.
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 px-6 py-4 space-y-2 bg-background">
          <Button className="w-full font-bold gap-2" onClick={onEnterClass}>
            Enter class
            <ArrowRight className="h-4 w-4" />
          </Button>
          {canViewRoster ? (
            <Button variant="outline" className="w-full gap-2" onClick={onManageRoster}>
              <UserPlus className="h-4 w-4" />
              Class roster
            </Button>
          ) : null}
          {isStudent ? (
            <div className="flex gap-2">
              {onAttendance ? (
                <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={onAttendance}>
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Attendance
                </Button>
              ) : null}
              {onGrades ? (
                <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={onGrades}>
                  <GraduationCap className="h-3.5 w-3.5" />
                  Grades
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
