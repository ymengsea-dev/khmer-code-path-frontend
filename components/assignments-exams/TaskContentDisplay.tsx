"use client";

import React from "react";
import {
  BookOpen,
  Download,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAuthedFile } from "@/lib/download";
import type { TaskContentBlockDto } from "@/lib/types/assignments-exams-api";

interface TaskContentDisplayProps {
  blocks: TaskContentBlockDto[] | null | undefined;
  assignmentId?: number;
  examId?: number;
}

function parseAiPreview(content: string | null | undefined): Array<{
  question: string;
  options: string[];
}> {
  if (!content) return [];
  try {
    const cleaned = content
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Record<string, unknown>>)
      .filter((q) => q.question && Array.isArray(q.options))
      .map((q) => ({
        question: String(q.question),
        options: (q.options as unknown[]).map(String),
      }));
  } catch {
    return [];
  }
}

const downloadFile = downloadAuthedFile;

export function TaskContentDisplay({
  blocks,
}: TaskContentDisplayProps) {
  if (!blocks?.length) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => (
        <div
          key={`${block.kind}-${block.orderIndex}-${idx}`}
          className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-4 space-y-3"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            {block.kind === "AI_QUESTIONS" ? (
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            ) : block.kind === "FILE" ? (
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <BookOpen className="h-3.5 w-3.5 text-violet-600" />
            )}
            {block.label ?? block.kind}
          </p>

          {block.kind === "AI_QUESTIONS" ? (
            <AiQuestionsPreview content={block.generatedContent} />
          ) : null}

          {block.kind === "FILE" && block.downloadUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                void downloadFile(
                  block.downloadUrl!,
                  block.fileName ?? "file",
                ).catch((err) =>
                  window.alert(
                    err instanceof Error
                      ? err.message
                      : "Could not download this file.",
                  ),
                )
              }
            >
              <Download className="h-4 w-4" />
              Download {block.fileName}
            </Button>
          ) : null}

          {block.kind === "LIBRARY_SOURCE" ? (
            <LibraryBlockContent block={block} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AiQuestionsPreview({
  content,
}: {
  content: string | null | undefined;
}) {
  const questions = parseAiPreview(content);
  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Questions attached.</p>
    );
  }
  return (
    <ol className="space-y-3 list-decimal list-inside text-sm">
      {questions.map((q, i) => (
        <li key={i} className="space-y-1">
          <span className="font-medium">{q.question}</span>
          <ul className="list-none pl-4 space-y-0.5 text-muted-foreground">
            {q.options.map((opt, j) => (
              <li key={j}>
                {String.fromCharCode(65 + j)}. {opt}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function LibraryBlockContent({ block }: { block: TaskContentBlockDto }) {
  if (block.htmlContent) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: block.htmlContent }}
      />
    );
  }
  if (block.downloadUrl) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() =>
          void downloadFile(
            block.downloadUrl!,
            block.fileName ?? block.label ?? "material",
          ).catch((err) =>
            window.alert(
              err instanceof Error
                ? err.message
                : "Could not download this file.",
            ),
          )
        }
      >
        <Download className="h-4 w-4" />
        Download {block.label ?? "material"}
      </Button>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      {block.label ?? "Referenced material"}
    </p>
  );
}

export function TaskContentDisplayCompact({
  blocks,
}: TaskContentDisplayProps) {
  if (!blocks?.length) return null;
  const supplemental = blocks.filter((b) => b.kind !== "AI_QUESTIONS");
  if (supplemental.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
        Reference materials (review before starting)
      </p>
      <TaskContentDisplay blocks={supplemental} />
    </div>
  );
}
