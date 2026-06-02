"use client";

import type { ReactNode } from "react";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { cn } from "@/lib/utils";
import { formatDocumentTimestamp } from "@/lib/editor/html-content";

export interface RichTextDocumentEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  bodyHtml: string;
  onBodyChange: (html: string) => void;
  updatedAt?: string;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  editorId?: string;
  variant?: "default" | "apple";
  className?: string;
  /** Toolbar row above the title (tags, save, etc.) */
  toolbar?: ReactNode;
  /** Extra fields between title and body (module picker, etc.) */
  meta?: ReactNode;
  /** Controls on the rich text formatting toolbar (e.g. file attach) */
  editorToolbarEnd?: ReactNode;
}

export function RichTextDocumentEditor({
  title,
  onTitleChange,
  bodyHtml,
  onBodyChange,
  updatedAt,
  titlePlaceholder = "Title",
  bodyPlaceholder = "Start writing…",
  disabled = false,
  readOnly = false,
  editorId = "rich-text-body-editor",
  variant = "apple",
  className,
  toolbar,
  meta,
  editorToolbarEnd,
}: RichTextDocumentEditorProps) {
  return (
    <div className={cn("flex flex-1 flex-col min-h-0 overflow-hidden", className)}>
      {toolbar ? (
        <div className="shrink-0 h-11 px-3 flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08]">
          {toolbar}
        </div>
      ) : null}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              document.getElementById(editorId)?.focus();
            }
          }}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className="shrink-0 w-full bg-transparent border-none px-10 sm:px-14 pt-4 pb-1 text-[28px] font-bold text-foreground tracking-tight outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
          placeholder={titlePlaceholder}
        />
        {updatedAt ? (
          <p className="shrink-0 px-10 sm:px-14 pb-2 text-[12px] text-muted-foreground">
            {formatDocumentTimestamp(updatedAt)}
          </p>
        ) : null}
        {meta ? <div className="shrink-0 px-10 sm:px-14 pb-3">{meta}</div> : null}
        <RichTextEditor
          html={bodyHtml}
          onChange={onBodyChange}
          placeholder={bodyPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          variant={variant}
          editorId={editorId}
          toolbarEnd={editorToolbarEnd}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}
