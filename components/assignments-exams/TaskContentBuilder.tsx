"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FileUp,
  Loader2,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  GlassInput,
  GlassSelect,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  loadQuizMaterialSources,
  parseQuizMaterialSourceKey,
  type QuizMaterialSource,
} from "@/lib/quiz-material-sources";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { assignmentsExamsService } from "@/lib/services/assignments-exams-service";
import type { ContentBuilderLabels } from "@/lib/assignments-exams-ui";
import type { TaskContentDraft } from "@/lib/task-content-draft";

interface TaskContentBuilderProps {
  labels: ContentBuilderLabels;
  value: TaskContentDraft;
  onChange: (draft: TaskContentDraft) => void;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TaskContentBuilder({
  labels,
  value,
  onChange,
}: TaskContentBuilderProps) {
  const [sources, setSources] = useState<QuizMaterialSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedSourceKey, setSelectedSourceKey] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [libraryPickKey, setLibraryPickKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSourcesLoading(true);
    loadQuizMaterialSources()
      .then((list) => {
        setSources(list);
        if (list.length > 0) {
          setSelectedSourceKey(list[0].key);
          setLibraryPickKey(list[0].key);
        }
      })
      .catch((err) =>
        setSourcesError(getApiErrorMessage(err, "Could not load materials.")),
      )
      .finally(() => setSourcesLoading(false));
  }, []);

  const groupedSources = useMemo(() => {
    const map = new Map<string, QuizMaterialSource[]>();
    for (const s of sources) {
      const group = s.group || "Materials";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(s);
    }
    return Array.from(map.entries());
  }, [sources]);

  const selectedSource = parseQuizMaterialSourceKey(selectedSourceKey);

  const handleGenerate = async () => {
    if (!selectedSource) {
      setGenerateError("Select a source to generate from.");
      return;
    }
    const count = Math.min(30, Math.max(1, Number(questionCount) || 10));
    setGenerating(true);
    setGenerateError(null);
    try {
      let result;
      if (selectedSource.kind === "lesson" && selectedSource.lessonId != null) {
        result = await lessonAiService.generateQuizFromLesson(
          selectedSource.lessonId,
          { materialId: selectedSource.materialId, questionCount: count },
        );
      } else if (
        selectedSource.kind === "library-content" &&
        selectedSource.libraryItemId != null
      ) {
        result = await lessonAiService.generateQuizFromLibraryContent(
          selectedSource.libraryItemId,
          { questionCount: count },
        );
      } else if (
        selectedSource.kind === "library" &&
        selectedSource.libraryItemId != null
      ) {
        result = await lessonAiService.generateQuizFromLibrary(
          selectedSource.libraryItemId,
          {
            materialId: selectedSource.materialId,
            questionCount: count,
          },
        );
      } else {
        throw new Error("Invalid source");
      }
      onChange({
        ...value,
        aiBlocks: [
          ...value.aiBlocks,
          {
            id: newId(),
            sourceKey: selectedSource.key,
            sourceLabel: selectedSource.label,
            questionCount: result.questionCount,
            generatedContent: result.generatedContent,
          },
        ],
      });
    } catch (err) {
      setGenerateError(
        getApiErrorMessage(err, "") ||
          "Generation failed. Ensure Ollama is running.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAddLibrary = () => {
    const source = parseQuizMaterialSourceKey(libraryPickKey);
    if (!source) return;
    if (value.librarySources.some((s) => s.key === source.key)) return;
    onChange({
      ...value,
      librarySources: [...value.librarySources, source],
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const stored = await assignmentsExamsService.uploadContentFile(file);
        uploaded.push({
          id: newId(),
          storageKey: stored.storageKey,
          fileName: stored.fileName,
          contentType: stored.contentType,
          sizeBytes: stored.sizeBytes,
        });
      }
      onChange({ ...value, files: [...value.files, ...uploaded] });
    } catch (err) {
      setUploadError(getApiErrorMessage(err, "Upload failed."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAi = useCallback(
    (id: string) =>
      onChange({
        ...value,
        aiBlocks: value.aiBlocks.filter((b) => b.id !== id),
      }),
    [onChange, value],
  );

  const removeFile = useCallback(
    (id: string) =>
      onChange({
        ...value,
        files: value.files.filter((f) => f.id !== id),
      }),
    [onChange, value],
  );

  const removeLibrary = useCallback(
    (key: string) =>
      onChange({
        ...value,
        librarySources: value.librarySources.filter((s) => s.key !== key),
      }),
    [onChange, value],
  );

  const hasAny =
    value.aiBlocks.length > 0 ||
    value.files.length > 0 ||
    value.librarySources.length > 0;

  return (
    <div className="space-y-5">
      {/* AI section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {labels.aiSectionLabel}
            </p>
          </div>
        </div>
        {sourcesLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/30 dark:border-white/8 bg-white/25 dark:bg-white/4 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading materials…
          </div>
        ) : sources.length === 0 ? (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
            {sourcesError ??
              "No materials yet. Upload in Content Management or class lessons."}
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <GlassSelect
              value={selectedSourceKey}
              onChange={(e) => setSelectedSourceKey(e.target.value)}
              className="h-11 flex-1 min-w-0"
            >
              {groupedSources.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </GlassSelect>
            <GlassInput
              type="number"
              min={1}
              max={30}
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="h-11 w-full sm:w-24"
              disabled={generating}
              aria-label="Question count"
            />
            <button
              type="button"
              disabled={generating || sourcesLoading}
              onClick={() => void handleGenerate()}
              className={cn(
                glassBtnSubtleClass,
                "h-11 shrink-0 gap-2 px-4 text-xs font-semibold",
              )}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 text-sky-600" />
              )}
              {labels.aiGenerateLabel}
            </button>
          </div>
        )}
        {generateError ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{generateError}</p>
        ) : null}
        {value.aiBlocks.map((block) => (
          <div
            key={block.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-sky-500/20 bg-sky-500/8 px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {block.questionCount} questions
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {block.sourceLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeAi(block.id)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              aria-label="Remove AI block"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* File upload section */}
      <div className="space-y-3 border-t border-white/25 dark:border-white/8 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/12 text-muted-foreground">
            <FileUp className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {labels.fileSectionLabel}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void handleFileUpload(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(glassBtnSubtleClass, "h-10 gap-2 px-4 text-xs font-semibold")}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {labels.fileUploadLabel}
        </button>
        {uploadError ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{uploadError}</p>
        ) : null}
        {value.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/30 dark:border-white/8 bg-white/20 dark:bg-white/4 px-3.5 py-2.5"
          >
            <span className="truncate text-xs font-medium">{file.fileName}</span>
            <button
              type="button"
              onClick={() => removeFile(file.id)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Content Management section */}
      <div className="space-y-3 border-t border-white/25 dark:border-white/8 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {labels.librarySectionLabel}
          </p>
        </div>
        {sources.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <GlassSelect
              value={libraryPickKey}
              onChange={(e) => setLibraryPickKey(e.target.value)}
              className="h-11 flex-1 min-w-0"
            >
              {groupedSources.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </GlassSelect>
            <button
              type="button"
              onClick={handleAddLibrary}
              className={cn(
                glassBtnSubtleClass,
                "h-11 shrink-0 px-4 text-xs font-semibold",
              )}
            >
              {labels.librarySelectLabel}
            </button>
          </div>
        ) : null}
        {value.librarySources.map((source) => (
          <div
            key={source.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-3.5 py-2.5"
          >
            <span className="truncate text-xs font-medium">{source.label}</span>
            <button
              type="button"
              onClick={() => removeLibrary(source.key)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              aria-label="Remove library source"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {!hasAny ? (
        <p className="text-xs italic text-muted-foreground text-center py-2">
          {labels.emptyContentHint}
        </p>
      ) : null}
    </div>
  );
}
