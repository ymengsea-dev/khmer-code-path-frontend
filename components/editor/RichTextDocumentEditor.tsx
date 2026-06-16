"use client";

import { useState, type ReactNode } from "react";
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
  // Portal target: editor formatting buttons render into this div (same floating row as toolbar)
  const [toolbarPortalEl, setToolbarPortalEl] = useState<HTMLDivElement | null>(null);
  const [toolbarRowEl, setToolbarRowEl] = useState<HTMLDivElement | null>(null);

  const hasFloating = !readOnly && (toolbar || true);

  return (
    <div className={cn("flex flex-1 flex-col min-h-0 overflow-hidden relative", className)}>
      {/* Floating row: tag/share pills on the left, editor formatting buttons on the right */}
      {hasFloating ? (
        <div
          ref={setToolbarRowEl}
          className="absolute top-3 left-3 right-3 sm:left-6 sm:right-6 z-10 flex items-center gap-2 pointer-events-none min-w-0"
        >
          {/* Left: custom toolbar items (Tag, Share, etc.) */}
          {toolbar ? (
            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              {toolbar}
            </div>
          ) : null}
          {/* Editor formatting toolbar — shrink-wraps to button content */}
          <div
            ref={setToolbarPortalEl}
            className="pointer-events-auto ml-auto shrink-0 glass-panel rounded-xl px-1 py-0.5 flex items-center"
          />
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
          className={cn(
            "shrink-0 w-full bg-transparent border-none px-6 pb-1 text-[28px] font-bold text-foreground tracking-tight outline-none placeholder:text-muted-foreground/50 disabled:opacity-60",
            hasFloating ? "pt-16" : "pt-4"
          )}
          placeholder={titlePlaceholder}
        />
        {updatedAt ? (
          <p className="shrink-0 px-6 pb-2 text-[12px] text-muted-foreground">
            {formatDocumentTimestamp(updatedAt)}
          </p>
        ) : null}
        {meta ? <div className="shrink-0 px-6 pb-3">{meta}</div> : null}
        <RichTextEditor
          html={bodyHtml}
          onChange={onBodyChange}
          placeholder={bodyPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          variant={variant}
          editorId={editorId}
          toolbarEnd={editorToolbarEnd}
          toolbarPortalEl={toolbarPortalEl}
          toolbarMeasureEl={toolbarRowEl}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}
