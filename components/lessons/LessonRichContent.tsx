"use client";

import { useId } from "react";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { EMPTY_EDITOR_HTML, toEditorHtml } from "@/lib/editor/html-content";
import { cn } from "@/lib/utils";

interface LessonRichContentProps {
  html: string | null | undefined;
  className?: string;
  emptyMessage?: string;
}

function isEmptyLessonBody(content: string | null | undefined): boolean {
  const normalized = toEditorHtml(content);
  return (
    !normalized ||
    normalized === EMPTY_EDITOR_HTML ||
    normalized === "<p></p>" ||
    normalized.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() === ""
  );
}

/**
 * Read-only lesson body — same formatted document teachers build in the editor
 * (headings, lists, links). Students never see or edit raw HTML.
 */
export function LessonRichContent({
  html,
  className,
  emptyMessage = "Your teacher has not added notes for this lesson yet.",
}: LessonRichContentProps) {
  const editorId = useId().replace(/:/g, "");

  if (isEmptyLessonBody(html)) {
    return (
      <p className={cn("text-sm text-muted-foreground leading-relaxed", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 dark:border-zinc-800",
        "bg-white dark:bg-zinc-900/50 shadow-2xs overflow-clip",
        className
      )}
    >
      <RichTextEditor
        html={toEditorHtml(html)}
        onChange={() => {}}
        readOnly
        variant="apple"
        editorId={`lesson-reader-${editorId}`}
        className="border-0 rounded-none"
      />
    </div>
  );
}
