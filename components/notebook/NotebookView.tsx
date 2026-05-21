"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  MoreHorizontal,
  PenSquare,
  Plus,
  Search,
  Share2,
  SquarePen,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { noteService } from "@/lib/services/note-service";
import type { NoteDto, NoteSummaryDto, SharedNoteDto } from "@/lib/types/note-api";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { NoteTagPicker } from "@/components/notebook/NoteTagPicker";
import {
  parseNoteTags,
  primaryTagColor,
  serializeNoteTags,
  type NoteTag,
} from "@/lib/notebook/note-tags";

function formatNoteListDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  }
  return String(d.getFullYear());
}

function formatEditorTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function matchesSearch(note: NoteSummaryDto, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const tagLabels = parseNoteTags(note.tags).map((t) => t.label.toLowerCase());
  return (
    note.title.toLowerCase().includes(q) ||
    note.preview.toLowerCase().includes(q) ||
    (note.sourceLabel?.toLowerCase().includes(q) ?? false) ||
    tagLabels.some((label) => label.includes(q))
  );
}

function NoteTagBadge({ tag }: { tag: NoteTag }) {
  return (
    <span
      className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md border-0"
      style={{ color: tag.color, backgroundColor: `${tag.color}20` }}
    >
      {tag.label}
    </span>
  );
}

const EMPTY_BODY = "<p><br></p>";
const AUTOSAVE_MS = 30_000;

function buildShareUrl(shareToken: string): string {
  if (typeof window === "undefined") return `/?view=notebook&share=${shareToken}`;
  const path = window.location.pathname.replace(/\/$/, "") || "";
  return `${window.location.origin}${path}/?view=notebook&share=${encodeURIComponent(shareToken)}`;
}

function NoteRow({
  note,
  selected,
  onSelect,
  onDelete,
}: {
  note: NoteSummaryDto;
  selected: boolean;
  onSelect: () => void;
  onDelete: (note: NoteSummaryDto) => void;
}) {
  const accent = primaryTagColor(note.tags);
  const apiTags = parseNoteTags(note.tags);

  return (
    <div className="relative group px-2 py-0.5">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-lg py-2.5 pr-8 transition-colors border border-transparent overflow-hidden flex",
          selected
            ? "bg-white dark:bg-zinc-800 shadow-sm border-black/[0.04] dark:border-white/[0.06]"
            : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
        )}
      >
        {accent ? (
          <span
            className="w-1 shrink-0 rounded-full ml-2 mr-2.5 self-stretch min-h-[36px]"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        ) : (
          <span className="w-1 shrink-0 ml-2 mr-1" aria-hidden />
        )}
        <span className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="font-semibold text-[13px] text-foreground truncate">{note.title}</span>
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
              {formatNoteListDate(note.updatedAt)}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground truncate leading-snug">
            {note.preview || "No additional text"}
          </p>
          {(apiTags.length > 0 || note.sourceLabel) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {apiTags.map((tag) => (
                <NoteTagBadge key={`${note.id}-${tag.label}-${tag.color}`} tag={tag} />
              ))}
              {note.sourceLabel ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold px-1.5 py-0 h-5 border-0 bg-slate-500/10 text-slate-600 dark:text-slate-400"
                >
                  {note.sourceLabel}
                </Badge>
              ) : null}
            </div>
          )}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "absolute right-4 top-2.5 p-1 rounded-md text-muted-foreground",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "hover:bg-black/[0.06] dark:hover:bg-white/[0.08] outline-none",
            selected && "opacity-100"
          )}
          aria-label="Note options"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" className="w-40 p-1">
          <DropdownMenuItem
            className="cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => onDelete(note)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function NotebookView() {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const noteParam = get(QueryKey.note);
  const shareParam = get(QueryKey.share);

  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [activeNote, setActiveNote] = useState<NoteDto | null>(null);
  const [sharedNote, setSharedNote] = useState<SharedNoteDto | null>(null);
  const [title, setTitle] = useState("Untitled note");
  const [bodyHtml, setBodyHtml] = useState(EMPTY_BODY);
  const [tags, setTags] = useState<string[]>([]);
  const primaryTag = parseNoteTags(tags)[0] ?? null;

  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "dirty">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopyDone, setShareCopyDone] = useState(false);

  const dirtyRef = useRef(false);
  const isSharedView = Boolean(shareParam?.trim());

  const selectedId = noteParam ? Number(noteParam) : null;

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await noteService.list(searchQuery || undefined);
      setNotes(data.items);
    } catch {
      setNotes([]);
    } finally {
      setListLoading(false);
    }
  }, [searchQuery]);

  const loadNote = useCallback(async (id: number) => {
    setDetailLoading(true);
    setSaveError(null);
    try {
      const note = await noteService.get(id);
      setActiveNote(note);
      setTitle(note.title);
      setBodyHtml(note.bodyHtml || EMPTY_BODY);
      setTags(note.tags ?? []);
      dirtyRef.current = false;
      setSaveStatus("saved");
    } catch {
      setActiveNote(null);
      setSaveError("Could not load this note.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadShared = useCallback(async (token: string) => {
    setSharedLoading(true);
    setSaveError(null);
    try {
      const note = await noteService.getShared(token);
      setSharedNote(note);
    } catch {
      setSharedNote(null);
      setSaveError("This shared note is unavailable or the link has expired.");
    } finally {
      setSharedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSharedView) void loadList();
  }, [loadList, isSharedView]);

  useEffect(() => {
    if (isSharedView && shareParam) {
      void loadShared(shareParam);
      return;
    }
    setSharedNote(null);
  }, [isSharedView, shareParam, loadShared]);

  useEffect(() => {
    if (isSharedView) return;
    if (selectedId && Number.isFinite(selectedId)) {
      if (activeNote?.id === selectedId) return;
      void loadNote(selectedId);
      return;
    }
    if (!creating) {
      setActiveNote(null);
      setTitle("Untitled note");
      setBodyHtml(EMPTY_BODY);
      setTags([]);
      setSaveStatus("idle");
      dirtyRef.current = false;
    }
  }, [selectedId, loadNote, isSharedView, activeNote?.id, creating]);

  const buildSavePayload = useCallback(
    () => ({
      title: title.trim() || "Untitled note",
      bodyHtml,
      sourceLabel: activeNote?.sourceLabel ?? null,
      lessonId: activeNote?.lessonId ?? null,
      materialId: activeNote?.materialId ?? null,
      tags,
    }),
    [activeNote, bodyHtml, tags, title]
  );

  const persistNote = useCallback(
    async (silent = false) => {
      if (!dirtyRef.current && silent) return;
      if (!dirtyRef.current && !activeNote?.id && silent) return;
      setSaving(true);
      setSaveError(null);
      try {
        const payload = buildSavePayload();
        if (activeNote?.id) {
          const updated = await noteService.update(activeNote.id, payload);
          setActiveNote(updated);
          dirtyRef.current = false;
          setSaveStatus("saved");
          await loadList();
        } else if (!silent || dirtyRef.current) {
          const created = await noteService.create(payload);
          setActiveNote(created);
          setParams({ [QueryKey.note]: String(created.id), [QueryKey.share]: null });
          dirtyRef.current = false;
          setSaveStatus("saved");
          await loadList();
        }
      } catch {
        setSaveError("Failed to save note. Check that you are logged in.");
        if (!silent) setSaveStatus("dirty");
      } finally {
        setSaving(false);
      }
    },
    [activeNote, buildSavePayload, loadList, setParams]
  );

  useEffect(() => {
    if (isSharedView) return;
    const timer = window.setInterval(() => {
      if (dirtyRef.current) void persistNote(true);
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, [isSharedView, persistNote]);

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveStatus("dirty");
  };

  const handleSelectNote = (note: NoteSummaryDto) => {
    setParams({ [QueryKey.note]: String(note.id), [QueryKey.share]: null });
  };

  const createNewNote = useCallback(async () => {
    if (saving || creating) return;
    setCreating(true);
    setSaveError(null);
    try {
      const created = await noteService.create({
        title: "Untitled note",
        bodyHtml: EMPTY_BODY,
        tags: [],
      });
      setActiveNote(created);
      setTitle(created.title);
      setBodyHtml(created.bodyHtml || EMPTY_BODY);
      setTags(created.tags ?? []);
      dirtyRef.current = false;
      setSaveStatus("saved");
      setParams({ [QueryKey.note]: String(created.id), [QueryKey.share]: null });
      await loadList();
    } catch {
      setSaveError("Could not create note.");
    } finally {
      setCreating(false);
    }
  }, [creating, loadList, saving, setParams]);

  const handleDeleteNote = async (note: NoteSummaryDto) => {
    if (!window.confirm(`Delete "${note.title}" permanently?`)) return;
    try {
      await noteService.delete(note.id);
      if (selectedId === note.id) {
        setParams({ [QueryKey.note]: null });
        setActiveNote(null);
      }
      await loadList();
    } catch {
      setSaveError("Could not delete note.");
    }
  };

  const handleShare = async () => {
    if (!activeNote?.id) return;
    setShareCopyDone(false);
    try {
      if (dirtyRef.current) await persistNote(true);
      const data = await noteService.enableShare(activeNote.id);
      const url = buildShareUrl(data.shareToken);
      setShareUrl(url);
      setShareOpen(true);
      const refreshed = await noteService.get(activeNote.id);
      setActiveNote(refreshed);
    } catch {
      setSaveError("Could not create share link.");
    }
  };

  const filteredNotes = notes.filter((n) => matchesSearch(n, searchQuery));
  const noteCountLabel = `${notes.length} ${notes.length === 1 ? "Note" : "Notes"}`;
  const isSearchActive = Boolean(searchQuery.trim());

  const listPane = (
    <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col min-h-0 bg-[#f2f2f7] dark:bg-zinc-900/80 border-r border-black/[0.06] dark:border-white/[0.08]">
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Notes</h1>
          <p className="text-[12px] text-muted-foreground">{noteCountLabel}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="New note"
            disabled={creating || saving}
            onClick={() => void createNewNote()}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SquarePen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-[13px] bg-black/[0.04] dark:bg-white/[0.06] border-0 shadow-none rounded-lg"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No notes yet.</p>
            <Button size="sm" variant="outline" disabled={saving || creating} onClick={() => void createNewNote()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New note
            </Button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">
            {isSearchActive ? "Not found." : "No notes yet."}
          </p>
        ) : (
          filteredNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selected={selectedId === note.id}
              onSelect={() => handleSelectNote(note)}
              onDelete={(n) => void handleDeleteNote(n)}
            />
          ))
        )}
      </div>
    </aside>
  );

  if (isSharedView) {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden bg-[#fffef8] dark:bg-zinc-950">
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="shrink-0 h-11 px-4 flex items-center justify-end border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fffef8]/90 dark:bg-zinc-950/90">
            <span className="text-[12px] text-muted-foreground mr-auto">
              {sharedNote ? `Shared · ${sharedNote.ownerDisplayName}` : "Shared note"}
            </span>
          </div>
          {sharedLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sharedNote ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <h2 className="shrink-0 px-10 sm:px-14 pt-5 text-[28px] font-bold text-foreground tracking-tight">
                {sharedNote.title}
              </h2>
              <p className="shrink-0 px-10 sm:px-14 pb-2 text-[12px] text-muted-foreground">
                {formatEditorTimestamp(sharedNote.updatedAt)}
              </p>
              <RichTextEditor
                html={sharedNote.bodyHtml || EMPTY_BODY}
                onChange={() => {}}
                readOnly
                variant="apple"
                placeholder=""
                className="flex-1 min-h-0"
              />
            </div>
          ) : (
            <p className="p-12 text-sm text-muted-foreground text-center">
              {saveError ?? "Shared note not found."}
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden bg-[#f2f2f7] dark:bg-zinc-950">
      <div className="flex flex-1 min-h-0 h-full w-full flex-col lg:flex-row">
        {listPane}

        <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-[#fffef8] dark:bg-[#1c1c1e]">
          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedId != null || activeNote != null ? (
            <>
              <div className="shrink-0 h-11 px-3 flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <NoteTagPicker
                  tag={primaryTag}
                  disabled={detailLoading || saving}
                  onChange={(tag) => {
                    setTags(tag ? serializeNoteTags([tag]) : []);
                    markDirty();
                  }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[13px] text-muted-foreground gap-1.5"
                    disabled={!activeNote?.id}
                    onClick={() => void handleShare()}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[13px] font-medium"
                    disabled={saving}
                    onClick={() => void persistNote(false)}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : saveStatus === "saved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <PenSquare className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline ml-1">
                      {saving ? "Saving" : saveStatus === "saved" ? "Saved" : "Save"}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("note-body-editor")?.focus();
                    }
                  }}
                  className="shrink-0 w-full bg-transparent border-none px-10 sm:px-14 pt-4 pb-1 text-[28px] font-bold text-foreground tracking-tight outline-none placeholder:text-muted-foreground/50"
                  placeholder="Title"
                />
                {activeNote && (
                  <p className="shrink-0 px-10 sm:px-14 pb-2 text-[12px] text-muted-foreground">
                    {formatEditorTimestamp(activeNote.updatedAt)}
                  </p>
                )}
                <RichTextEditor
                  html={bodyHtml}
                  onChange={(html) => {
                    setBodyHtml(html);
                    markDirty();
                  }}
                  placeholder="Start writing…"
                  disabled={detailLoading || saving}
                  variant="apple"
                  className="flex-1 min-h-0"
                />
              </div>

              {(saveError || (saveStatus === "dirty" && !saving)) && (
                <p className="shrink-0 px-6 py-2 text-[11px] text-center text-muted-foreground border-t border-black/[0.04]">
                  {saveError ?? "Unsaved · auto-saves every 30s or tap Save"}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-8">
              <SquarePen className="h-12 w-12 opacity-30" />
              <p className="text-sm">Select a note or create a new one</p>
              <Button variant="outline" size="sm" disabled={creating} onClick={() => void createNewNote()}>
                <Plus className="h-4 w-4 mr-1.5" />
                New note
              </Button>
            </div>
          )}
        </main>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share note</DialogTitle>
            <DialogDescription>
              Anyone signed in to Khmer Code Path can open this link and view the note (read-only).
            </DialogDescription>
          </DialogHeader>
          <Input readOnly value={shareUrl} className="text-xs font-mono" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close
            </Button>
            <Button
              variant="inverse"
              className="gap-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setShareCopyDone(true);
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              {shareCopyDone ? "Copied" : "Copy link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
