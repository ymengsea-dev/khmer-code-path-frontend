"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Notebook,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { noteService } from "@/lib/services/note-service";
import type { NoteDto, NoteSummaryDto } from "@/lib/types/note-api";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";

type TagVariant = "exam" | "ai" | "default";

function tagClass(variant: TagVariant) {
  if (variant === "exam") {
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0";
  }
  if (variant === "ai") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0";
  }
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0";
}

function tagVariant(tags: string[]): TagVariant {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("ai"))) return "ai";
  if (lower.some((t) => t.includes("exam"))) return "exam";
  return "default";
}

function formatEdited(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

const EMPTY_BODY =
  "<p>Start typing your notes here. Use the toolbar for headings, lists, quotes, and links.</p>";

export function NotebookView() {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const noteParam = get(QueryKey.note);

  const [notes, setNotes] = useState<NoteSummaryDto[]>([]);
  const [activeNote, setActiveNote] = useState<NoteDto | null>(null);
  const [title, setTitle] = useState("Untitled note");
  const [bodyHtml, setBodyHtml] = useState(EMPTY_BODY);
  const [tags, setTags] = useState<string[]>(["Personal"]);

  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "dirty">("idle");

  const dirtyRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setTags(note.tags?.length ? note.tags : ["Personal"]);
      dirtyRef.current = false;
      setSaveStatus("saved");
    } catch {
      setActiveNote(null);
      setSaveError("Could not load this note.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId && Number.isFinite(selectedId)) {
      void loadNote(selectedId);
      return;
    }
    setActiveNote(null);
    setTitle("Untitled note");
    setBodyHtml(EMPTY_BODY);
    setTags(["Personal"]);
    setSaveStatus("idle");
    dirtyRef.current = false;
  }, [selectedId, loadNote]);

  const buildSavePayload = () => ({
    title: title.trim() || "Untitled note",
    bodyHtml,
    sourceLabel: activeNote?.sourceLabel ?? null,
    lessonId: activeNote?.lessonId ?? null,
    materialId: activeNote?.materialId ?? null,
    tags,
  });

  const persistNote = useCallback(
    async (silent = false) => {
      if (!dirtyRef.current && silent) return;
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
        } else {
          const created = await noteService.create(payload);
          setActiveNote(created);
          setParams({ [QueryKey.note]: String(created.id) });
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
    [activeNote, bodyHtml, loadList, setParams, tags, title]
  );

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      void persistNote(true);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  const handleSelectNote = (note: NoteSummaryDto) => {
    if (dirtyRef.current && activeNote) {
      void persistNote(true);
    }
    setParams({ [QueryKey.note]: String(note.id) });
  };

  const handleNewNote = async () => {
    if (dirtyRef.current && activeNote) {
      await persistNote(true);
    }
    setParams({ [QueryKey.note]: null });
    setActiveNote(null);
    setTitle("Untitled note");
    setBodyHtml(EMPTY_BODY);
    setTags(["Personal"]);
    dirtyRef.current = true;
    setSaveStatus("dirty");
  };

  const handleDelete = async () => {
    if (!activeNote?.id) return;
    if (!window.confirm("Delete this note permanently?")) return;
    try {
      await noteService.delete(activeNote.id);
      setParams({ [QueryKey.note]: null });
      setActiveNote(null);
      await loadList();
    } catch {
      setSaveError("Could not delete note.");
    }
  };

  const handleCreateFirst = async () => {
    setSaving(true);
    try {
      const created = await noteService.create({
        title: "Untitled note",
        bodyHtml: EMPTY_BODY,
        tags: ["Personal"],
      });
      setParams({ [QueryKey.note]: String(created.id) });
      await loadList();
    } catch {
      setSaveError("Could not create note.");
    } finally {
      setSaving(false);
    }
  };

  const displayTag = tags[0] ?? "Personal";
  const variant = tagVariant(tags);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          Digital Notebook
          <Notebook className="w-5 h-5 text-violet-500" />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rich-text notes saved to your account. Autosaves every 2 seconds while you edit.
        </p>
      </header>

      <div className="flex-1 min-h-0 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-6 h-full min-h-0">
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs min-h-[400px] lg:min-h-0">
            <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0 space-y-2">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 gap-1.5 text-xs font-semibold"
                onClick={() => void handleNewNote()}
              >
                <Plus className="w-3.5 h-3.5" />
                New note
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {listLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                  <Button
                    size="sm"
                    variant="inverse"
                    className="font-bold"
                    disabled={saving}
                    onClick={() => void handleCreateFirst()}
                  >
                    Create your first note
                  </Button>
                </div>
              ) : (
                notes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => handleSelectNote(note)}
                    className={cn(
                      "w-full text-left p-4 border-b border-slate-200/80 dark:border-zinc-800 transition-colors",
                      selectedId === note.id
                        ? "bg-violet-500/10 border-l-[3px] border-l-violet-500 pl-[13px]"
                        : "hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 border-l-[3px] border-l-transparent"
                    )}
                  >
                    <p className="font-semibold text-sm text-foreground mb-1">{note.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{note.preview}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(note.tags.length ? note.tags : ["Personal"]).slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          className={cn("text-[10px] font-bold", tagClass(tagVariant([tag])))}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs p-0 min-h-[500px] lg:min-h-0">
            {detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-violet-600 dark:text-violet-400 font-semibold text-xs"
                    onClick={() =>
                      alert("AI Polish will refine wording — connect to tutoring chat in a later sprint.")
                    }
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Polish
                  </Button>
                  <Input
                    className="h-8 w-36 text-xs"
                    placeholder="Tag (e.g. Exam Prep)"
                    value={tags[0] ?? ""}
                    onChange={(e) => {
                      setTags([e.target.value || "Personal"]);
                      markDirty();
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 px-6 pt-6 shrink-0">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          markDirty();
                        }}
                        className="w-full bg-transparent border-none text-2xl font-bold text-foreground outline-none mb-1"
                        placeholder="Note title"
                      />
                      <p className="text-[13px] text-muted-foreground">
                        {activeNote
                          ? `Last edited: ${formatEdited(activeNote.updatedAt)}${
                              activeNote.sourceLabel
                                ? ` • Source: ${activeNote.sourceLabel}`
                                : ""
                            }`
                          : "New note — save to store in the cloud"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-semibold"
                        disabled={!activeNote}
                        onClick={() => {
                          if (activeNote) {
                            void navigator.clipboard.writeText(
                              `${activeNote.title}\n\n${bodyHtml.replace(/<[^>]+>/g, " ")}`
                            );
                          }
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                        disabled={!activeNote}
                        onClick={() => void handleDelete()}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <RichTextEditor
                    html={bodyHtml}
                    onChange={(html) => {
                      setBodyHtml(html);
                      markDirty();
                    }}
                    disabled={detailLoading || saving}
                    className="flex-1 mx-2 mb-2"
                  />

                  <div className="px-6 pb-6 pt-2 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Saved to cloud
                        </>
                      ) : saveStatus === "dirty" ? (
                        "Unsaved changes"
                      ) : (
                        "Select or create a note"
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px] font-bold", tagClass(variant))}>
                        {displayTag}
                      </Badge>
                      <Button
                        variant="inverse"
                        className="font-bold h-9"
                        disabled={saving}
                        onClick={() => void persistNote(false)}
                      >
                        {saving ? "Saving…" : "Save now"}
                      </Button>
                    </div>
                  </div>
                  {saveError && (
                    <p className="px-6 pb-4 text-xs text-rose-600 dark:text-rose-400">
                      {saveError}
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
