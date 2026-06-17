"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Code,
  ExternalLink,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo,
  Highlighter,
  Strikethrough,
  Underline,
  Undo,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
  GlassInput,
} from "@/components/ui/glass-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const HIGHLIGHT_COLORS = [
  { hex: "#fef08a", label: "Yellow" },
  { hex: "#bbf7d0", label: "Green" },
  { hex: "#bfdbfe", label: "Blue" },
  { hex: "#fbcfe8", label: "Pink" },
  { hex: "#fed7aa", label: "Orange" },
  { hex: "#e9d5ff", label: "Purple" },
] as const;

function getListItemFromSelection(editor: HTMLElement): HTMLLIElement | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  let node: Node | null = sel.anchorNode;
  while (node && node !== editor) {
    if (node.nodeName === "LI") return node as HTMLLIElement;
    node = node.parentNode;
  }
  return null;
}

function isListItemEmpty(li: HTMLLIElement): boolean {
  const clone = li.cloneNode(true) as HTMLLIElement;
  clone.querySelectorAll("br").forEach((br) => br.remove());
  return (clone.textContent?.replace(/\u00a0/g, "").trim() ?? "") === "";
}

function isCaretAtStartOfElement(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return false;

  const testRange = document.createRange();
  testRange.selectNodeContents(el);
  testRange.setEnd(range.startContainer, range.startOffset);
  return testRange.toString().length === 0;
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ensureEditorLinks(editor: HTMLElement) {
  editor.querySelectorAll("a").forEach((anchor) => {
    if (anchor.closest(".note-embed")) return;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.classList.add("note-inline-link");
  });
}

function placeCaretInElement(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Empty list item + Enter/Backspace → normal paragraph below the list. */
function exitListItem(li: HTMLLIElement) {
  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return;

  const p = document.createElement("p");
  p.innerHTML = "<br>";

  const items = Array.from(list.children);
  const onlyItem = items.length === 1;
  const lastItem = li === list.lastElementChild;
  const idx = items.indexOf(li);

  if (onlyItem) {
    list.replaceWith(p);
  } else if (lastItem) {
    li.remove();
    list.after(p);
  } else {
    const afterItems = items.slice(idx + 1);
    li.remove();
    list.after(p);
    if (afterItems.length > 0) {
      const newList = document.createElement(list.tagName);
      afterItems.forEach((item) => newList.appendChild(item));
      p.after(newList);
    }
  }

  if (list.parentElement && list.children.length === 0) {
    list.remove();
  }

  placeCaretInElement(p);
}

/** Backspace at start of a list item with text → plain paragraph. */
function unwrapListItemToParagraph(li: HTMLLIElement) {
  const p = document.createElement("p");
  while (li.firstChild) {
    p.appendChild(li.firstChild);
  }
  if (!p.textContent?.replace(/\u00a0/g, "").trim()) {
    p.innerHTML = "<br>";
  }

  const list = li.parentElement;
  li.replaceWith(p);
  if (
    list &&
    (list.tagName === "UL" || list.tagName === "OL") &&
    list.children.length === 0
  ) {
    list.remove();
  }

  placeCaretInElement(p);
}

function ToolbarDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-px h-5 bg-black/8 dark:bg-white/10 mx-0.5 shrink-0",
        className,
      )}
      aria-hidden
    />
  );
}

function GlassToolbarButton({
  icon,
  title,
  onClick,
  disabled,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-lg",
        "text-muted-foreground hover:text-foreground transition-colors",
        "hover:bg-black/5 dark:hover:bg-white/8 disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
    >
      {icon}
    </button>
  );
}

export interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Apple Notes–style: borderless, minimal toolbar */
  variant?: "default" | "apple";
  /** DOM id for the contenteditable region (used for focus from title field) */
  editorId?: string;
  /** Extra controls at the end of the formatting toolbar (e.g. attach files) */
  toolbarEnd?: React.ReactNode;
  /** When provided the formatting toolbar is portalled into this element instead of rendered inline */
  toolbarPortalEl?: HTMLElement | null;
  /** Row element used to measure available toolbar width (avoids stretch-to-fill whitespace) */
  toolbarMeasureEl?: HTMLElement | null;
}

export function RichTextEditor({
  html,
  onChange,
  placeholder = "Start writing…",
  className,
  disabled = false,
  readOnly = false,
  variant = "default",
  editorId = "rich-text-body-editor",
  toolbarEnd,
  toolbarPortalEl,
  toolbarMeasureEl,
}: RichTextEditorProps) {
  const isApple = variant === "apple";
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [embedUrl, setEmbedUrl] = useState("https://");
  const savedRangeRef = useRef<Range | null>(null);
  const inlineToolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarLayout, setToolbarLayout] = useState<"compact" | "standard" | "full">("compact");

  /** ~28px per btn + gaps — measured against actual container width, not viewport */
  const TOOLBAR_FULL_WIDTH = 560;
  const TOOLBAR_STANDARD_WIDTH = 300;

  useEffect(() => {
    const measureEl = toolbarMeasureEl ?? inlineToolbarRef.current;
    if (!measureEl) return;

    const update = () => {
      const rowWidth = measureEl.getBoundingClientRect().width;
      const firstChild = measureEl.firstElementChild as HTMLElement | null;
      const leftWidth = firstChild?.getBoundingClientRect().width ?? 0;
      const gap = leftWidth > 0 ? 8 : 0;
      const available = Math.max(0, rowWidth - leftWidth - gap);

      if (available >= TOOLBAR_FULL_WIDTH) setToolbarLayout("full");
      else if (available >= TOOLBAR_STANDARD_WIDTH) setToolbarLayout("standard");
      else setToolbarLayout("compact");
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(measureEl);
    if (measureEl.firstElementChild) observer.observe(measureEl.firstElementChild);
    return () => observer.disconnect();
  }, [toolbarMeasureEl, toolbarPortalEl]);

  const syncFromProp = useCallback(() => {
    const el = editorRef.current;
    if (!el || isFocusedRef.current) return;
    if (el.innerHTML !== html) {
      el.innerHTML = html || "<p><br></p>";
    }
  }, [html]);

  useEffect(() => {
    syncFromProp();
    const el = editorRef.current;
    if (el) ensureEditorLinks(el);
  }, [syncFromProp, html]);

  const focusEditor = () => {
    if (!readOnly) editorRef.current?.focus();
  };

  const exec = (command: string, value?: string) => {
    if (readOnly || disabled) return;
    focusEditor();
    document.execCommand(command, false, value);
    emitChange();
  };

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    ensureEditorLinks(el);
    if (!readOnly) onChange(el.innerHTML);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    if (!editor || !range) return;
    editor.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const insertHtmlAtSelection = (html: string) => {
    const editor = editorRef.current;
    if (!editor || readOnly || disabled) return;
    editor.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    ensureEditorLinks(editor);
    emitChange();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const embed = target.closest<HTMLElement>(".note-embed");
    const anchor = target.closest<HTMLAnchorElement>("a");
    const href = embed?.dataset.url ?? anchor?.getAttribute("href");
    if (!href) return;

    const normalized = normalizeUrl(href);
    if (!normalized) return;

    e.preventDefault();
    e.stopPropagation();
    window.open(normalized, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || disabled) return;
    const editor = editorRef.current;
    if (!editor) return;

    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand("insertLineBreak");
        emitChange();
        return;
      }

      const li = getListItemFromSelection(editor);
      if (li && isListItemEmpty(li)) {
        e.preventDefault();
        e.stopPropagation();
        exitListItem(li);
        emitChange();
        return;
      }
      return;
    }

    if (e.key === "Backspace") {
      const li = getListItemFromSelection(editor);
      if (!li) return;

      const sel = window.getSelection();
      if (!sel?.rangeCount || !sel.isCollapsed) return;

      if (!isCaretAtStartOfElement(li)) return;

      e.preventDefault();
      e.stopPropagation();

      if (isListItemEmpty(li)) {
        exitListItem(li);
      } else {
        unwrapListItemToParagraph(li);
      }
      emitChange();
    }
  };

  const openLinkDialog = () => {
    if (readOnly || disabled) return;
    saveSelection();
    const sel = window.getSelection();
    let existingHref = "https://";
    if (sel?.anchorNode) {
      const node =
        sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as Element)
          : sel.anchorNode.parentElement;
      const anchor = node?.closest("a");
      if (anchor?.href) existingHref = anchor.href;
    }
    setLinkUrl(existingHref);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = normalizeUrl(linkUrl);
    if (!url) {
      setLinkOpen(false);
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    const sel = window.getSelection();
    const hasSelection =
      sel?.rangeCount &&
      sel.anchorNode &&
      editor.contains(sel.anchorNode) &&
      !sel.isCollapsed;

    if (hasSelection) {
      document.execCommand("createLink", false, url);
    } else {
      const label = hostnameFromUrl(url);
      insertHtmlAtSelection(
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="note-inline-link">${escapeHtml(label)}</a>`,
      );
      setLinkOpen(false);
      return;
    }
    ensureEditorLinks(editor);
    emitChange();
    setLinkOpen(false);
  };

  const openEmbedDialog = () => {
    if (readOnly || disabled) return;
    saveSelection();
    setEmbedUrl("https://");
    setEmbedOpen(true);
  };

  const applyHighlight = (color: string | null) => {
    if (readOnly || disabled) return;
    focusEditor();
    restoreSelection();
    if (color) {
      document.execCommand("hiliteColor", false, color);
      document.execCommand("backColor", false, color);
    } else {
      document.execCommand("hiliteColor", false, "transparent");
      document.execCommand("backColor", false, "transparent");
    }
    emitChange();
    setHighlightOpen(false);
  };

  const applyEmbed = () => {
    const url = normalizeUrl(embedUrl);
    if (!url) {
      setEmbedOpen(false);
      return;
    }
    const host = hostnameFromUrl(url);
    const block = [
      `<div class="note-embed" contenteditable="false" data-url="${escapeHtml(url)}">`,
      `<div class="note-embed-inner">`,
      `<span class="note-embed-label">Embedded link</span>`,
      `<a class="note-embed-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(host)}</a>`,
      `<p class="note-embed-url">${escapeHtml(url)}</p>`,
      `</div></div>`,
      `<p><br></p>`,
    ].join("");
    insertHtmlAtSelection(block);
    setEmbedOpen(false);
  };

  const iconClass = "w-3.5 h-3.5";
  const btnDisabled = disabled || readOnly;

  const highlightDropdown = (
    <DropdownMenu
      open={highlightOpen}
      onOpenChange={(open) => {
        if (open) saveSelection();
        setHighlightOpen(open);
      }}
    >
      <DropdownMenuTrigger
        disabled={btnDisabled}
        className={cn(
          "h-7 w-7 p-0 shrink-0 inline-flex items-center justify-center rounded-lg",
          "text-muted-foreground hover:text-foreground transition-colors",
          "hover:bg-black/5 dark:hover:bg-white/8 disabled:opacity-40",
        )}
        title="Highlight"
        aria-label="Highlight"
        onMouseDown={(e) => e.preventDefault()}
      >
        <Highlighter className={iconClass} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-44 p-3 rounded-xl"
      >
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">
          Highlight
        </p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {HIGHLIGHT_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight(preset.hex)}
              className="h-7 w-7 rounded-md border border-black/10 hover:scale-105 transition-transform"
              style={{ backgroundColor: preset.hex }}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyHighlight(null)}
        >
          Clear highlight
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const overflowItems: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      label: "Strikethrough",
      icon: <Strikethrough className={iconClass} />,
      onClick: () => exec("strikeThrough"),
    },
    {
      label: "Heading 2",
      icon: <Heading2 className={iconClass} />,
      onClick: () => exec("formatBlock", "h2"),
    },
    {
      label: "Heading 3",
      icon: <Heading3 className={iconClass} />,
      onClick: () => exec("formatBlock", "h3"),
    },
    {
      label: "Numbered list",
      icon: <ListOrdered className={iconClass} />,
      onClick: () => exec("insertOrderedList"),
    },
    {
      label: "Quote",
      icon: <Quote className={iconClass} />,
      onClick: () => exec("formatBlock", "blockquote"),
    },
    {
      label: "Code block",
      icon: <Code className={iconClass} />,
      onClick: () => exec("formatBlock", "pre"),
    },
    {
      label: "Align left",
      icon: <AlignLeft className={iconClass} />,
      onClick: () => exec("justifyLeft"),
    },
    {
      label: "Align center",
      icon: <AlignCenter className={iconClass} />,
      onClick: () => exec("justifyCenter"),
    },
    {
      label: "Insert hyperlink",
      icon: <Link className={iconClass} />,
      onClick: openLinkDialog,
    },
    {
      label: "Embed link",
      icon: <ExternalLink className={iconClass} />,
      onClick: openEmbedDialog,
    },
    {
      label: "Undo",
      icon: <Undo className={iconClass} />,
      onClick: () => exec("undo"),
    },
    {
      label: "Redo",
      icon: <Redo className={iconClass} />,
      onClick: () => exec("redo"),
    },
  ];

  const showExtended = toolbarLayout === "standard" || toolbarLayout === "full";
  const showFull = toolbarLayout === "full";
  const showOverflow = toolbarLayout !== "full";

  const toolbarButtons = !readOnly ? (
    <div className="flex items-center gap-0.5 shrink-0">
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Core formatting — always visible */}
        <GlassToolbarButton
          icon={<Bold className={iconClass} />}
          title="Bold"
          disabled={btnDisabled}
          onClick={() => exec("bold")}
        />
        <GlassToolbarButton
          icon={<Italic className={iconClass} />}
          title="Italic"
          disabled={btnDisabled}
          onClick={() => exec("italic")}
        />
        <GlassToolbarButton
          icon={<Underline className={iconClass} />}
          title="Underline"
          disabled={btnDisabled}
          onClick={() => exec("underline")}
        />
        <GlassToolbarButton
          icon={<List className={iconClass} />}
          title="Bullet list"
          disabled={btnDisabled}
          onClick={() => exec("insertUnorderedList")}
        />

        {showExtended ? (
          <>
            <GlassToolbarButton
              icon={<Strikethrough className={iconClass} />}
              title="Strikethrough"
              disabled={btnDisabled}
              onClick={() => exec("strikeThrough")}
            />
            {highlightDropdown}
            <ToolbarDivider />
            <GlassToolbarButton
              icon={<Heading2 className={iconClass} />}
              title="Heading 2"
              disabled={btnDisabled}
              onClick={() => exec("formatBlock", "h2")}
            />
            <GlassToolbarButton
              icon={<Heading3 className={iconClass} />}
              title="Heading 3"
              disabled={btnDisabled}
              onClick={() => exec("formatBlock", "h3")}
            />
            <GlassToolbarButton
              icon={<ListOrdered className={iconClass} />}
              title="Numbered list"
              disabled={btnDisabled}
              onClick={() => exec("insertOrderedList")}
            />
          </>
        ) : null}

        {showFull ? (
          <>
            <ToolbarDivider />
            <GlassToolbarButton
              icon={<Quote className={iconClass} />}
              title="Quote"
              disabled={btnDisabled}
              onClick={() => exec("formatBlock", "blockquote")}
            />
            <GlassToolbarButton
              icon={<Code className={iconClass} />}
              title="Code block"
              disabled={btnDisabled}
              onClick={() => exec("formatBlock", "pre")}
            />
            <ToolbarDivider />
            <GlassToolbarButton
              icon={<AlignLeft className={iconClass} />}
              title="Align left"
              disabled={btnDisabled}
              onClick={() => exec("justifyLeft")}
            />
            <GlassToolbarButton
              icon={<AlignCenter className={iconClass} />}
              title="Align center"
              disabled={btnDisabled}
              onClick={() => exec("justifyCenter")}
            />
            <GlassToolbarButton
              icon={<Link className={iconClass} />}
              title="Insert hyperlink"
              disabled={btnDisabled}
              onClick={openLinkDialog}
            />
            <GlassToolbarButton
              icon={<ExternalLink className={iconClass} />}
              title="Embed link"
              disabled={btnDisabled}
              onClick={openEmbedDialog}
            />
            <ToolbarDivider />
            <GlassToolbarButton
              icon={<Undo className={iconClass} />}
              title="Undo"
              disabled={btnDisabled}
              onClick={() => exec("undo")}
            />
            <GlassToolbarButton
              icon={<Redo className={iconClass} />}
              title="Redo"
              disabled={btnDisabled}
              onClick={() => exec("redo")}
            />
          </>
        ) : null}

        {toolbarEnd ? (
          <>
            <ToolbarDivider className="hidden sm:block" />
            <div className="shrink-0 flex items-center">{toolbarEnd}</div>
          </>
        ) : null}
      </div>

      {showOverflow ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={btnDisabled}
            className={cn(
              "shrink-0 ml-0.5 h-7 w-7 inline-flex items-center justify-center rounded-lg",
              "text-muted-foreground hover:text-foreground transition-colors",
              "hover:bg-black/5 dark:hover:bg-white/8 disabled:opacity-40",
            )}
            title="More formatting"
            aria-label="More formatting"
            onMouseDown={(e) => e.preventDefault()}
          >
            <MoreHorizontal className={iconClass} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={6}
            className="w-52 p-1.5 rounded-xl"
          >
            {toolbarLayout === "compact" ? (
              <>
                {overflowItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    className="gap-2.5 rounded-lg text-sm"
                    onClick={item.onClick}
                  >
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <div className="px-2 py-2 border-t border-border/60 mt-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Highlight
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {HIGHLIGHT_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        title={preset.label}
                        aria-label={preset.label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          saveSelection();
                          applyHighlight(preset.hex);
                        }}
                        className="h-6 w-6 rounded-md border border-black/10 hover:scale-105 transition-transform"
                        style={{ backgroundColor: preset.hex }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              overflowItems.slice(4).map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  className="gap-2.5 rounded-lg text-sm"
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <div
        className={cn(
          "flex flex-col",
          readOnly ? "overflow-clip" : "min-h-0 overflow-hidden",
          isApple
            ? readOnly
              ? "bg-transparent"
              : "flex-1 h-full bg-transparent"
            : "rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950",
          className,
        )}
      >
        {/* Inline toolbar — only when no portal target is given */}
        {!toolbarPortalEl && toolbarButtons && (
          <div
            ref={inlineToolbarRef}
            className={cn(
              "flex items-center gap-0.5 shrink-0",
              isApple
                ? "mx-4 mt-2 glass-panel rounded-xl px-1 py-0.5"
                : "px-3 py-2 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80",
            )}
          >
            {toolbarButtons}
          </div>
        )}

        <div
          className={cn(
            readOnly
              ? ""
              : "flex-1 min-h-0 overflow-y-auto overscroll-y-contain",
            isApple && "bg-transparent dark:bg-transparent",
          )}
        >
          <div
            id={editorId}
            ref={editorRef}
            contentEditable={!disabled && !readOnly}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline
            aria-readonly={readOnly}
            data-placeholder={placeholder}
            onInput={emitChange}
            onClick={handleEditorClick}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              emitChange();
            }}
            className={cn(
              "outline-none focus-visible:ring-0 block w-full min-h-full",
              isApple
                ? "min-h-[280px] px-6 py-4 pb-24 text-[17px] leading-[1.6] text-foreground/90"
                : "min-h-[280px] px-6 py-6 pb-12 text-[15px] leading-[1.75] text-foreground",
              "[&_p]:mb-3 [&_p:last-child]:mb-0",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
              "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2",
              "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
              "[&_blockquote]:border-l-4 [&_blockquote]:border-violet-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3",
              "[&_pre]:rounded-md [&_pre]:bg-slate-100 [&_pre]:dark:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:overflow-x-auto [&_pre]:my-3",
              "[&_a.note-inline-link]:text-[#007AFF] [&_a.note-inline-link]:underline [&_a.note-inline-link]:cursor-pointer",
              "[&_.note-embed]:my-4 [&_.note-embed]:block [&_.note-embed]:cursor-pointer",
              "[&_.note-embed-inner]:rounded-lg [&_.note-embed-inner]:border [&_.note-embed-inner]:border-violet-500/30",
              "[&_.note-embed-inner]:bg-violet-500/5 [&_.note-embed-inner]:px-4 [&_.note-embed-inner]:py-3",
              "[&_.note-embed-inner]:hover:bg-violet-500/10 [&_.note-embed-inner]:transition-colors",
              "[&_.note-embed-label]:text-[10px] [&_.note-embed-label]:font-bold [&_.note-embed-label]:uppercase",
              "[&_.note-embed-label]:tracking-wider [&_.note-embed-label]:text-violet-600 dark:[&_.note-embed-label]:text-violet-400",
              "[&_.note-embed-link]:text-sm [&_.note-embed-link]:font-semibold [&_.note-embed-link]:text-foreground",
              "[&_.note-embed-link]:block [&_.note-embed-link]:mt-1 [&_.note-embed-link]:no-underline",
              "[&_.note-embed-url]:text-xs [&_.note-embed-url]:text-muted-foreground [&_.note-embed-url]:mt-1",
              "[&_.note-embed-url]:truncate [&_.note-embed-url]:mb-0",
              "[&_strong]:font-bold [&_em]:italic",
              "[&_mark]:rounded-sm [&_mark]:px-0.5",
              "[&_span]:rounded-sm",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
              (disabled || readOnly) && "opacity-90 cursor-default",
            )}
          />
        </div>
      </div>

      {/* Portal toolbar into external container when provided */}
      {toolbarPortalEl && toolbarButtons
        ? createPortal(toolbarButtons, toolbarPortalEl)
        : null}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="gap-5">
          <DialogHeader>
            <DialogTitle>Insert hyperlink</DialogTitle>
            <DialogDescription>
              Select text first to turn it into a link, or leave nothing
              selected to insert the URL as link text. Click any link in the
              note to open it.
            </DialogDescription>
          </DialogHeader>
          <GlassInput
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className={glassBtnSubtleClass}
              onClick={() => setLinkOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className={cn(glassBtnPrimaryClass, "gap-1.5")} onClick={applyLink}>
              Insert
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="gap-5">
          <DialogHeader>
            <DialogTitle>Embed link</DialogTitle>
            <DialogDescription>
              Adds a preview card in your note. Click the card to open the URL
              in a new tab.
            </DialogDescription>
          </DialogHeader>
          <GlassInput
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyEmbed();
              }
            }}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className={glassBtnSubtleClass}
              onClick={() => setEmbedOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className={cn(glassBtnPrimaryClass, "gap-1.5")} onClick={applyEmbed}>
              Embed
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
