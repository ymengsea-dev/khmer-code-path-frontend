"use client";

import React, { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  List,
  Code,
  Sparkles,
  Share2,
  Trash2,
  CheckCircle2,
  Notebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";

interface NoteItem {
  id: number;
  title: string;
  preview: string;
  tag: string;
  tagVariant: "exam" | "ai";
  lastEdited: string;
  source: string;
  body: string;
}

const notes: NoteItem[] = [
  {
    id: 1,
    title: "Binary Search Complexity",
    preview: "Binary search requires a sorted array...",
    tag: "Exam Prep",
    tagVariant: "exam",
    lastEdited: "2 hours ago",
    source: "Lesson 5",
    body: `<p>Binary search requires a <strong>sorted array</strong>. It works by repeatedly dividing the search interval in half.</p>
<br>
<p><strong>Complexity:</strong></p>
<ul><li>Best Case: O(1)</li><li>Average Case: O(log n)</li><li>Worst Case: O(log n)</li></ul>
<br>
<div data-ai-snippet="true">
<p style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Quick-Saved from AI Q&amp;A</p>
<p>"The best case for Binary Search is O(1). This happens when the target element is exactly at the middle position..."</p>
</div>
<br>
<p>Add your thoughts here...</p>`,
  },
  {
    id: 2,
    title: "AI Summary: Lesson 4",
    preview: "Big O notation describes the upper bound...",
    tag: "AI-Generated",
    tagVariant: "ai",
    lastEdited: "Yesterday",
    source: "Lesson 4",
    body: `<p>Big O notation describes the <strong>upper bound</strong> of an algorithm's growth rate.</p>
<br>
<p>Common complexities: O(1), O(log n), O(n), O(n log n), O(n²).</p>
<br>
<p>Add your thoughts here...</p>`,
  },
];

function tagClass(variant: NoteItem["tagVariant"]) {
  return variant === "exam"
    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0"
    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0";
}

export function NotebookView() {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const noteParam = get(QueryKey.note);
  const selectedId = noteParam ? Number(noteParam) : notes[0].id;
  const selectedNote = notes.find((n) => n.id === selectedId) ?? notes[0];
  const [title, setTitle] = useState(selectedNote.title);

  useEffect(() => {
    setTitle(selectedNote.title);
  }, [selectedNote.id, selectedNote.title]);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNote = (note: NoteItem) => {
    setParams({ [QueryKey.note]: String(note.id) });
    setTitle(note.title);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          Digital Notebook
          <Notebook className="w-5 h-5 text-violet-500" />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Organize your learning and AI-generated insights.
        </p>
      </header>

      <div className="flex-1 min-h-0 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-6 h-full min-h-0">
          {/* Notes list */}
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs min-h-[400px] lg:min-h-0">
            <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredNotes.map((note) => (
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
                  <p className="font-semibold text-sm text-foreground mb-1">
                    {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {note.preview}
                  </p>
                  <div className="mt-2">
                    <Badge className={cn("text-[10px] font-bold", tagClass(note.tagVariant))}>
                      {note.tag}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Editor */}
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs p-0 min-h-[500px] lg:min-h-0">
            <div className="px-4 py-3 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("bold")}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("italic")}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("insertUnorderedList")}
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execCommand("formatBlock", "pre")}
                title="Code Block"
              >
                <Code className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-1" />
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-violet-600 dark:text-violet-400 font-semibold text-xs"
                onClick={() =>
                  alert("AI Assistant: Optimizing your notes for clarity...")
                }
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Polish
              </Button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-6 sm:p-8 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6 shrink-0">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none text-2xl font-bold text-foreground outline-none mb-1"
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Last edited: {selectedNote.lastEdited} • Source:{" "}
                    {selectedNote.source}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div
                key={selectedNote.id}
                contentEditable
                suppressContentEditableWarning
                className="flex-1 overflow-y-auto text-[15px] leading-relaxed text-foreground outline-none min-h-[200px] [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-bold [&_[data-ai-snippet]]:rounded-lg [&_[data-ai-snippet]]:border [&_[data-ai-snippet]]:border-violet-500/20 [&_[data-ai-snippet]]:bg-violet-500/5 [&_[data-ai-snippet]]:p-4 [&_[data-ai-snippet]]:my-2"
                dangerouslySetInnerHTML={{ __html: selectedNote.body }}
              />

              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Autosaved to cloud
                </span>
                <Button variant="inverse" className="font-bold h-9">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
