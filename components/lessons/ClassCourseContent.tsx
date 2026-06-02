"use client";

import { BookOpen, ChevronRight, FileText, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";
import { LessonRichContent } from "@/components/lessons/LessonRichContent";
import { cn } from "@/lib/utils";

interface ClassCourseContentProps {
  lessons: LessonSummaryDto[];
  lesson: LessonDetailDto | null;
  canManage: boolean;
  onSelectLesson: (id: number) => void;
  onBackToList: () => void;
  onDeleteLesson?: (id: number) => void;
  deletingLessonId?: number | null;
}

export function ClassCourseContent({
  lessons,
  lesson,
  canManage,
  onSelectLesson,
  onBackToList,
  onDeleteLesson,
  deletingLessonId,
}: ClassCourseContentProps) {
  if (lesson) {
    return (
      <article className="space-y-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold text-violet-600 dark:text-violet-400 -ml-2"
          onClick={onBackToList}
        >
          ← All lessons
        </Button>
        <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
          <h2 className="text-2xl font-extrabold text-foreground leading-tight">{lesson.title}</h2>
          {lesson.moduleTag ? (
            <p className="text-sm text-muted-foreground mt-1.5">{lesson.moduleTag}</p>
          ) : null}
        </div>
        <LessonRichContent
          html={lesson.description}
          emptyMessage={
            canManage
              ? "No lesson notes on this assignment yet. Write content in Course Content (sidebar), then assign or update the template for this class."
              : "Your teacher has not published notes for this lesson yet. Check the Materials tab for files."
          }
        />
      </article>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12 max-w-md mx-auto">
        {canManage
          ? "No lessons assigned yet. Create content in Course Content (sidebar), then assign it to this class."
          : "No lessons are available yet. Your teacher will publish them when the class is ready."}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {canManage
          ? "Lessons in this class. Open one to preview the student view."
          : "Pick a lesson to read notes and study."}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lessons.map((item) => (
          <li key={item.id} className="group">
            <Card
              className={cn(
                "border border-slate-200/80 dark:border-zinc-800 h-full overflow-clip",
                "hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md transition-all"
              )}
            >
              <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>

                {/* clickable text area */}
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => onSelectLesson(item.id)}
                >
                  <p className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  {item.moduleTag ? (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {item.moduleTag}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      {item.materialCount} files
                    </span>
                    {item.aiReady ? (
                      <Badge className="text-[10px] font-bold h-5 px-1.5 bg-violet-600 text-white border-0 gap-0.5">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    ) : null}
                  </div>
                </button>

                {/* right-side actions */}
                <div className="shrink-0 flex flex-col items-center gap-1.5 mt-0.5">
                  {canManage && onDeleteLesson ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete lesson "${item.title}"`}
                      disabled={deletingLessonId === item.id}
                      onClick={() => onDeleteLesson(item.id)}
                      className={cn(
                        "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  <ChevronRight
                    className="h-5 w-5 text-muted-foreground cursor-pointer"
                    onClick={() => onSelectLesson(item.id)}
                  />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
