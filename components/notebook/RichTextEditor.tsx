"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  html,
  onChange,
  placeholder = "Start writing…",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(html);

  const syncFromProp = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== html) {
      el.innerHTML = html || "";
      lastHtmlRef.current = html;
    }
  }, [html]);

  useEffect(() => {
    syncFromProp();
  }, [syncFromProp]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const exec = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
    emitChange();
  };

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    const next = el.innerHTML;
    lastHtmlRef.current = next;
    onChange(next);
  };

  const insertLink = () => {
    const url = window.prompt("Link URL");
    if (url) {
      exec("createLink", url);
    }
  };

  const toolbarBtn = (
    icon: React.ReactNode,
    command: string,
    title: string,
    value?: string
  ) => (
    <Button
      key={title}
      type="button"
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => exec(command, value)}
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn("flex flex-col min-h-0 flex-1", className)}>
      <div className="px-3 py-2 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center gap-1 shrink-0">
        {toolbarBtn(<Bold className="w-3.5 h-3.5" />, "bold", "Bold")}
        {toolbarBtn(<Italic className="w-3.5 h-3.5" />, "italic", "Italic")}
        {toolbarBtn(<Underline className="w-3.5 h-3.5" />, "underline", "Underline")}
        {toolbarBtn(<Strikethrough className="w-3.5 h-3.5" />, "strikeThrough", "Strikethrough")}
        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-0.5" />
        {toolbarBtn(<Heading2 className="w-3.5 h-3.5" />, "formatBlock", "Heading 2", "h2")}
        {toolbarBtn(<Heading3 className="w-3.5 h-3.5" />, "formatBlock", "Heading 3", "h3")}
        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-0.5" />
        {toolbarBtn(<List className="w-3.5 h-3.5" />, "insertUnorderedList", "Bullet list")}
        {toolbarBtn(<ListOrdered className="w-3.5 h-3.5" />, "insertOrderedList", "Numbered list")}
        {toolbarBtn(<Quote className="w-3.5 h-3.5" />, "formatBlock", "Quote", "blockquote")}
        {toolbarBtn(<Code className="w-3.5 h-3.5" />, "formatBlock", "Code block", "pre")}
        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-0.5" />
        {toolbarBtn(<AlignLeft className="w-3.5 h-3.5" />, "justifyLeft", "Align left")}
        {toolbarBtn(<AlignCenter className="w-3.5 h-3.5" />, "justifyCenter", "Align center")}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Insert link"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLink}
        >
          <Link className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-0.5" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Undo"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("undo")}
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title="Redo"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("redo")}
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        className={cn(
          "flex-1 overflow-y-auto min-h-[240px] px-6 py-5 text-[15px] leading-relaxed text-foreground outline-none",
          "focus-visible:ring-2 focus-visible:ring-violet-500/20 rounded-b-md",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-violet-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_pre]:rounded-md [&_pre]:bg-slate-100 [&_pre]:dark:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:overflow-x-auto",
          "[&_a]:text-violet-600 [&_a]:underline dark:[&_a]:text-violet-400",
          "[&_strong]:font-bold [&_em]:italic",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      />
    </div>
  );
}
