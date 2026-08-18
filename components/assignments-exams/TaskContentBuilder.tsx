"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FileUp,
  Loader2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  GlassInput,
  GlassSelect,
  glassSelectClass,
  solidFieldClass,
} from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  loadQuizMaterialSources,
  parseQuizMaterialSourceKey,
  type QuizMaterialSource,
} from "@/lib/quiz-material-sources";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { ModelSelector } from "@/components/ai/ModelSelector";
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
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [libraryPickKey, setLibraryPickKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "files" | "library">("ai");
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
      const model = selectedModel ?? undefined;
      if (selectedSource.kind === "lesson" && selectedSource.lessonId != null) {
        result = await lessonAiService.generateQuizFromLesson(
          selectedSource.lessonId,
          { materialId: selectedSource.materialId, questionCount: count, model },
        );
      } else if (
        selectedSource.kind === "library-content" &&
        selectedSource.libraryItemId != null
      ) {
        result = await lessonAiService.generateQuizFromLibraryContent(
          selectedSource.libraryItemId,
          { questionCount: count, model },
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
            model,
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

  const addedCount =
    value.aiBlocks.length + value.files.length + value.librarySources.length;

  const tabs = [
    { id: "ai" as const, icon: Sparkles, label: labels.aiSectionLabel },
    { id: "files" as const, icon: FileUp, label: labels.fileSectionLabel },
    { id: "library" as const, icon: BookOpen, label: labels.librarySectionLabel },
  ];

  const sourcePicker = (
    onKeyChange: (key: string) => void,
    selected: string,
  ) => (
    <GlassSelect
      value={selected}
      onChange={(e) => onKeyChange(e.target.value)}
      className={cn("h-10 w-full min-w-0", solidFieldClass)}
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
  );

  return (
    <div className="space-y-4">
      {/* Source method picker */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
                active
                  ? "bg-[#305FC9] text-white shadow-md"
                  : "border border-black/6 bg-white/60 text-muted-foreground hover:text-foreground dark:border-white/8 dark:bg-zinc-900/50",
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active adder panel */}
      <div>
        {sourcesLoading && activeTab !== "files" ? (
          <div className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading materials…
          </div>
        ) : sources.length === 0 && activeTab !== "files" ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            {sourcesError ??
              "No materials yet. Upload in Content Management or class lessons."}
          </p>
        ) : activeTab === "ai" ? (
          <div className="space-y-2.5">
            {sourcePicker(setSelectedSourceKey, selectedSourceKey)}
            <div className="flex flex-wrap items-center gap-2">
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                className={cn(glassSelectClass, "h-10 flex-1 min-w-32 text-xs", solidFieldClass)}
              />
              <div className="flex items-center gap-1.5">
                <GlassInput
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className={cn("h-10 w-16 text-center", solidFieldClass)}
                  disabled={generating}
                  aria-label="Question count"
                />
                <span className="text-[11px] text-muted-foreground">questions</span>
              </div>
              <button
                type="button"
                disabled={generating || sourcesLoading}
                onClick={() => void handleGenerate()}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {labels.aiGenerateLabel}
              </button>
            </div>
            {generateError ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {generateError}
              </p>
            ) : null}
          </div>
        ) : activeTab === "files" ? (
          <div className="space-y-2.5">
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
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/15 bg-slate-50/60 px-4 py-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground dark:border-white/15 dark:bg-white/2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              {labels.fileUploadLabel}
            </button>
            {uploadError ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {uploadError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            {sourcePicker(setLibraryPickKey, libraryPickKey)}
            <button
              type="button"
              onClick={handleAddLibrary}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90 active:scale-[0.98]"
            >
              {labels.librarySelectLabel}
            </button>
          </div>
        )}
      </div>

      {/* Unified added-content list */}
      {addedCount > 0 ? (
        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Added content · {addedCount}
          </p>
          {value.aiBlocks.map((block) => (
            <AddedRow
              key={block.id}
              icon={Sparkles}
              title={`${block.questionCount} question${block.questionCount === 1 ? "" : "s"}`}
              subtitle={block.sourceLabel}
              onRemove={() => removeAi(block.id)}
            />
          ))}
          {value.files.map((file) => (
            <AddedRow
              key={file.id}
              icon={FileUp}
              title={file.fileName}
              onRemove={() => removeFile(file.id)}
            />
          ))}
          {value.librarySources.map((source) => (
            <AddedRow
              key={source.key}
              icon={BookOpen}
              title={source.label}
              onRemove={() => removeLibrary(source.key)}
            />
          ))}
        </div>
      ) : (
        <p className="py-1 text-center text-xs text-muted-foreground">
          {labels.emptyContentHint}
        </p>
      )}
    </div>
  );
}

function AddedRow({
  icon: Icon,
  title,
  subtitle,
  onRemove,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle?: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-white/5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
