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
import { RichTextDocumentEditor } from "@/components/editor/RichTextDocumentEditor";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EMPTY_EDITOR_HTML, formatDocumentTimestamp } from "@/lib/editor/html-content";
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

const AUTOSAVE_MS = 30_000;
const NOTE_EDITOR_ID = "note-body-editor";

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
          "w-full text-left rounded-xl py-2.5 pr-8 transition-all overflow-hidden flex",
          selected
            ? ""
            : "hover:bg-black/4"
        )}
        style={selected ? {
          background: "var(--glass-bg)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        } : undefined}
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
            "hover:bg-black/6 dark:hover:bg-white/8 outline-none",
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
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const noteParam = get(QueryKey.note);
  const shareParam = get(QueryKey.share);

  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [activeNote, setActiveNote] = useState<NoteDto | null>(null);
  const [sharedNote, setSharedNote] = useState<SharedNoteDto | null>(null);
  const [title, setTitle] = useState("Untitled note");
  const [bodyHtml, setBodyHtml] = useState(EMPTY_EDITOR_HTML);
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
      setBodyHtml(note.bodyHtml || EMPTY_EDITOR_HTML);
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
      setBodyHtml(EMPTY_EDITOR_HTML);
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

  useEffect(() => {
    if (isSharedView) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (saving || creating || detailLoading) return;
      void persistNote(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [creating, detailLoading, isSharedView, persistNote, saving]);

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
        bodyHtml: EMPTY_EDITOR_HTML,
        tags: [],
      });
      setActiveNote(created);
      setTitle(created.title);
      setBodyHtml(created.bodyHtml || EMPTY_EDITOR_HTML);
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
    const ok = await confirm(`"${note.title}" will be permanently deleted.`, {
      title: "Delete Note",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
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

  const taggedNotes = filteredNotes.filter((n) => parseNoteTags(n.tags).length > 0);
  const untaggedNotes = filteredNotes.filter((n) => parseNoteTags(n.tags).length === 0);

  const listPane = (
    <aside
      className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 rounded-2xl overflow-hidden"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border-color)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      }}
    >
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Notes</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{noteCountLabel}</p>
        </div>
        <button
          type="button"
          aria-label="New note"
          disabled={creating || saving}
          onClick={() => void createNewNote()}
          className="h-8 w-8 rounded-xl inline-flex items-center justify-center transition-colors disabled:opacity-40"
          style={{
            background: "var(--glass-bg-subtle)",
            border: "1px solid var(--glass-border-color)",
            boxShadow: "none",
            color: "#305FC9",
          }}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SquarePen className="h-[15px] w-[15px]" />
          )}
        </button>
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div
          className="relative flex items-center rounded-xl h-9"
          style={{
            background: "var(--glass-bg-subtle)",
            border: "1px solid var(--glass-border-color)",
            boxShadow: "none",
          }}
        >
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground z-10" />
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-8 pr-3 text-[13px] bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No notes yet.</p>
            <button
              type="button"
              disabled={saving || creating}
              onClick={() => void createNewNote()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium disabled:opacity-40"
              style={{ background: "#305FC9", color: "white" }}
            >
              <Plus className="h-3.5 w-3.5" />
              New note
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">
            {isSearchActive ? "Not found." : "No notes yet."}
          </p>
        ) : (
          <>
            {taggedNotes.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Tagged
                </p>
                {taggedNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    selected={selectedId === note.id}
                    onSelect={() => handleSelectNote(note)}
                    onDelete={(n) => void handleDeleteNote(n)}
                  />
                ))}
              </>
            )}
            {untaggedNotes.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {taggedNotes.length > 0 ? "Untagged" : "Notes"}
                </p>
                {untaggedNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    selected={selectedId === note.id}
                    onSelect={() => handleSelectNote(note)}
                    onDelete={(n) => void handleDeleteNote(n)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );

  if (isSharedView) {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main
          className="flex-1 flex flex-col min-w-0 min-h-0 rounded-2xl overflow-hidden"
          style={{
            background: "var(--glass-bg-subtle)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border-color)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          <div className="shrink-0 h-11 px-4 flex items-center" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
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
              <h2 className="shrink-0 px-6 pt-5 text-[28px] font-bold text-foreground tracking-tight">
                {sharedNote.title}
              </h2>
              <p className="shrink-0 px-6 pb-2 text-[12px] text-muted-foreground">
                {formatDocumentTimestamp(sharedNote.updatedAt)}
              </p>
              <RichTextEditor
                html={sharedNote.bodyHtml || EMPTY_EDITOR_HTML}
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
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">
      <div className="flex flex-1 min-h-0 h-full w-full flex-col lg:flex-row gap-3">
        {listPane}

        <main
          className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden rounded-2xl"
          style={{
            background: "var(--glass-bg-subtle)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border-color)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedId != null || activeNote != null ? (
            <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
              <RichTextDocumentEditor
                title={title}
                onTitleChange={(v) => {
                  setTitle(v);
                  markDirty();
                }}
                bodyHtml={bodyHtml}
                onBodyChange={(html) => {
                  setBodyHtml(html);
                  markDirty();
                }}
                updatedAt={activeNote?.updatedAt}
                disabled={detailLoading || saving}
                editorId={NOTE_EDITOR_ID}
                toolbar={
                  <>
                    <NoteTagPicker
                      tag={primaryTag}
                      disabled={detailLoading || saving}
                      onChange={(tag) => {
                        setTags(tag ? serializeNoteTags([tag]) : []);
                        markDirty();
                      }}
                    />
                    <button
                      type="button"
                      disabled={!activeNote?.id}
                      onClick={() => void handleShare()}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-medium text-muted-foreground transition-all disabled:opacity-40 ml-auto"
                      style={{
                        background: "var(--glass-bg-subtle)",
                        border: "1px solid var(--glass-border-color)",
                        boxShadow: "none",
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </>
                }
                className="flex-1 min-h-0"
              />

              {/* Floating save button — bottom right */}
              <button
                type="button"
                disabled={saving}
                onClick={() => void persistNote(false)}
                className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-medium transition-all disabled:opacity-40"
                style={saveStatus === "saved" ? {
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  color: "#16a34a",
                } : {
                  background: "#305FC9",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(48,95,201,0.25)",
                }}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveStatus === "saved" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <PenSquare className="h-3.5 w-3.5" />
                )}
                <span>{saving ? "Saving" : saveStatus === "saved" ? "Saved" : "Save"}</span>
              </button>

              {saveError && (
                <p className="absolute bottom-12 right-4 z-10 text-[11px] text-red-500">
                  {saveError}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-8">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mb-1"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "none",
                }}
              >
                <SquarePen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm">Select a note or create a new one</p>
              <button
                type="button"
                disabled={creating}
                onClick={() => void createNewNote()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium disabled:opacity-40"
                style={{ background: "#305FC9", color: "white" }}
              >
                <Plus className="h-4 w-4" />
                New note
              </button>
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
