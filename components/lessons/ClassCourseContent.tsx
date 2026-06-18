"use client";

import { ChevronRight, FileText, Sparkles } from "lucide-react";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";

interface ClassCourseContentProps {
  lessons: LessonSummaryDto[];
  lesson?: LessonDetailDto | null;
  canManage: boolean;
  onSelectLesson: (id: number) => void;
  onBackToList?: () => void;
}

export function ClassCourseContent({
  lessons,
  canManage,
  onSelectLesson,
}: ClassCourseContentProps) {
  if (lessons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12 max-w-md mx-auto">
        {canManage
          ? "No lessons assigned yet. Create content in Content Management (sidebar), then assign it to this class."
          : "No lessons are available yet. Your teacher will publish them when the class is ready."}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {lessons.map((item, index) => (
        <li key={item.id} className="group">
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectLesson(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectLesson(item.id);
              }
            }}
            className="w-full text-left transition-all duration-150 hover:scale-[1.005] active:scale-[0.998] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/30 rounded-2xl"
          >
            <div
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border-color)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-zinc-500"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 leading-snug line-clamp-1">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {item.moduleTag && (
                    <span className="text-[11px] text-zinc-400 truncate">{item.moduleTag}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                    <FileText className="h-3 w-3" />
                    {item.materialCount} {item.materialCount === 1 ? "file" : "files"}
                  </span>
                  {item.aiReady && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-500">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="shrink-0 h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
