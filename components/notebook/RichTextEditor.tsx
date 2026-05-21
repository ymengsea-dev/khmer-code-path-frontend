"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
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
  if (list && (list.tagName === "UL" || list.tagName === "OL") && list.children.length === 0) {
    list.remove();
  }

  placeCaretInElement(p);
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
}

export function RichTextEditor({
  html,
  onChange,
  placeholder = "Start writing…",
  className,
  disabled = false,
  readOnly = false,
  variant = "default",
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
      sel?.rangeCount && sel.anchorNode && editor.contains(sel.anchorNode) && !sel.isCollapsed;

    if (hasSelection) {
      document.execCommand("createLink", false, url);
    } else {
      const label = hostnameFromUrl(url);
      insertHtmlAtSelection(
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="note-inline-link">${escapeHtml(label)}</a>`
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

  const toolbarBtn = (
    icon: React.ReactNode,
    command: string,
    title: string,
    value?: string
  ) => (
    <Button
      key={title}
      type="button"
      variant={isApple ? "ghost" : "outline"}
      size="sm"
      className={cn(
        "h-8 w-8 p-0 shrink-0",
        isApple && "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      )}
      title={title}
      disabled={disabled || readOnly}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => exec(command, value)}
    >
      {icon}
    </Button>
  );

  return (
    <>
      <div
        className={cn(
          "flex flex-col min-h-0 overflow-hidden",
          isApple
            ? "flex-1 h-full bg-transparent"
            : "rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950",
          className
        )}
      >
        {!readOnly && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-0.5 shrink-0",
              isApple
                ? "px-4 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08]"
                : "px-3 py-2 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80"
            )}
          >
            {toolbarBtn(<Bold className="w-3.5 h-3.5" />, "bold", "Bold")}
            {toolbarBtn(<Italic className="w-3.5 h-3.5" />, "italic", "Italic")}
            {toolbarBtn(<Underline className="w-3.5 h-3.5" />, "underline", "Underline")}
            {toolbarBtn(<Strikethrough className="w-3.5 h-3.5" />, "strikeThrough", "Strikethrough")}
            <DropdownMenu
              open={highlightOpen}
              onOpenChange={(open) => {
                if (open) saveSelection();
                setHighlightOpen(open);
              }}
            >
              <DropdownMenuTrigger
                disabled={disabled || readOnly}
                className={cn(
                  "h-8 w-8 p-0 shrink-0 inline-flex items-center justify-center rounded-md",
                  isApple
                    ? "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
                title="Highlight"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Highlighter className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="w-44 p-3 rounded-xl">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">Highlight</p>
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
            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-0.5" />
            {toolbarBtn(<Heading2 className="w-3.5 h-3.5" />, "formatBlock", "Heading 2", "h2")}
            {toolbarBtn(<Heading3 className="w-3.5 h-3.5" />, "formatBlock", "Heading 3", "h3")}
            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-0.5" />
            {toolbarBtn(<List className="w-3.5 h-3.5" />, "insertUnorderedList", "Bullet list")}
            {toolbarBtn(<ListOrdered className="w-3.5 h-3.5" />, "insertOrderedList", "Numbered list")}
            {toolbarBtn(<Quote className="w-3.5 h-3.5" />, "formatBlock", "Quote", "blockquote")}
            {toolbarBtn(<Code className="w-3.5 h-3.5" />, "formatBlock", "Code block", "pre")}
            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-0.5" />
            {toolbarBtn(<AlignLeft className="w-3.5 h-3.5" />, "justifyLeft", "Align left")}
            {toolbarBtn(<AlignCenter className="w-3.5 h-3.5" />, "justifyCenter", "Align center")}
            <Button
              type="button"
              variant={isApple ? "ghost" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 shrink-0",
                isApple && "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              )}
              title="Insert hyperlink"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={openLinkDialog}
            >
              <Link className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={isApple ? "ghost" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 shrink-0",
                isApple && "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              )}
              title="Embed link"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={openEmbedDialog}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-0.5" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
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
              className="h-8 w-8 p-0 shrink-0"
              title="Redo"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec("redo")}
            >
              <Redo className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto overscroll-y-contain",
            isApple && "bg-[#fffef8] dark:bg-[#1c1c1e]"
          )}
        >
          <div
            id="note-body-editor"
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
                ? "min-h-[280px] px-10 sm:px-14 py-4 pb-24 text-[17px] leading-[1.6] text-foreground/90"
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
            (disabled || readOnly) && "opacity-90 cursor-default"
          )}
        />
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert hyperlink</DialogTitle>
            <DialogDescription>
              Select text first to turn it into a link, or leave nothing selected to insert the URL as
              link text. Click any link in the note to open it.
            </DialogDescription>
          </DialogHeader>
          <Input
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button variant="inverse" onClick={applyLink}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed link</DialogTitle>
            <DialogDescription>
              Adds a preview card in your note. Click the card to open the URL in a new tab.
            </DialogDescription>
          </DialogHeader>
          <Input
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmbedOpen(false)}>
              Cancel
            </Button>
            <Button variant="inverse" onClick={applyEmbed}>
              Embed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
