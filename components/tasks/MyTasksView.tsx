"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Loader2,
  Plus,
  Sparkles,
  Zap,
  FlaskConical,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/services/auth-service";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import {
  loadQuizMaterialSources,
  parseQuizMaterialSourceKey,
  type QuizMaterialSource,
} from "@/lib/quiz-material-sources";
import type { QuizGenerateDto } from "@/lib/types/lesson-ai-api";
import { useQueryState } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";

type UserRole = "student" | "teacher" | "admin";

interface QuizItem {
  id: number;
  title: string;
  description: string;
  status: "pending" | "completed";
  statusLabel: string;
  meta: string;
  completedOn?: string;
}

const placeholderQuizzes: QuizItem[] = [
  {
    id: 1,
    title: "Quiz 5: Binary Search Efficiency",
    description: "Based on Lesson 5 materials. 10 Questions, 20 Minutes.",
    status: "pending",
    statusLabel: "Pending",
    meta: "Due: Tomorrow",
  },
  {
    id: 2,
    title: "Quiz 4: Big O Fundamentals",
    description: "Completed on May 8, 2026.",
    status: "completed",
    statusLabel: "Completed",
    meta: "Score: 90/100",
    completedOn: "May 8, 2026",
  },
];

function tryFormatQuizPreview(content: string): string {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    /* plain text / markdown from model */
  }
  return content;
}

export function MyTasksView() {
  const [role, setRole] = useState<UserRole>("student");
  const [sources, setSources] = useState<QuizMaterialSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [lessonSource, setLessonSource] = useQueryState(QueryKey.lessonSource, "");
  const [questionCount, setQuestionCount] = useQueryState(QueryKey.questions, "10");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizGenerateDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [draftQuizzes, setDraftQuizzes] = useState<QuizItem[]>([]);

  const selectedSource = useMemo(() => {
    if (!lessonSource) return null;
    const found = sources.find((s) => s.key === lessonSource);
    if (found) return found;
    return parseQuizMaterialSourceKey(lessonSource);
  }, [lessonSource, sources]);

  const groupedSources = useMemo(() => {
    const map = new Map<string, QuizMaterialSource[]>();
    for (const s of sources) {
      const list = map.get(s.group) ?? [];
      list.push(s);
      map.set(s.group, list);
    }
    return Array.from(map.entries());
  }, [sources]);

  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    setSourcesError(null);
    try {
      const list = await loadQuizMaterialSources();
      setSources(list);
      if (list.length > 0 && !list.some((s) => s.key === lessonSource)) {
        setLessonSource(list[0].key);
      }
    } catch {
      setSources([]);
      setSourcesError(
        "Could not load lesson materials. Upload files in Course Content or a lesson template first."
      );
    } finally {
      setSourcesLoading(false);
    }
  }, [lessonSource, setLessonSource]);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await authService.me();
        if (response?.data?.role) {
          setRole(response.data.role.toLowerCase() as UserRole);
        }
      } catch {
        /* default student */
      }
    }
    void fetchUserRole();
  }, []);

  useEffect(() => {
    if (role === "teacher" || role === "admin") {
      void loadSources();
    }
  }, [role, loadSources]);

  const handleGenerate = async () => {
    if (!selectedSource) {
      setGenerateError("Select a lesson file to generate from.");
      return;
    }
    const count = Math.min(30, Math.max(1, Number(questionCount) || 10));

    setGenerating(true);
    setGenerateError(null);

    try {
      let result: QuizGenerateDto;
      if (selectedSource.kind === "lesson" && selectedSource.lessonId != null) {
        result = await lessonAiService.generateQuizFromLesson(selectedSource.lessonId, {
          materialId: selectedSource.materialId,
          questionCount: count,
        });
      } else if (
        selectedSource.kind === "library" &&
        selectedSource.libraryItemId != null
      ) {
        result = await lessonAiService.generateQuizFromLibrary(
          selectedSource.libraryItemId,
          {
            materialId: selectedSource.materialId,
            questionCount: count,
          }
        );
      } else {
        throw new Error("Invalid source");
      }

      setGeneratedQuiz(result);
      setPreviewOpen(true);

      const label =
        sources.find((s) => s.key === lessonSource)?.label ??
        result.sourceFileName;
      setDraftQuizzes((prev) => [
        {
          id: Date.now(),
          title: `AI Quiz: ${label.split(" — ").pop() ?? "Material"}`,
          description: `${count} questions from ${result.sourceFileName}. Index-on-demand RAG.`,
          status: "pending",
          statusLabel: "Draft",
          meta: "Just generated",
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Quiz generation failed:", err);
      setGenerateError(
        "Generation failed. Ensure MinIO is running, the file is uploaded, and your AI API key is valid."
      );
    } finally {
      setGenerating(false);
    }
  };

  const isTeacher = role === "teacher" || role === "admin";
  const displayQuizzes = [...draftQuizzes, ...placeholderQuizzes];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quizzes
            <FlaskConical className="w-5 h-5 text-violet-500" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assess your knowledge with AI-powered quizzes.
          </p>
        </div>
        {isTeacher && (
          <Button
            size="sm"
            variant="inverse"
            className="gap-1.5 font-bold h-8.5 text-xs active:translate-y-px transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Quiz
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {isTeacher && (
          <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                  Quick AI Quiz Generator
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Picks a file from class lessons or lesson templates you uploaded in Course
                  Content. RAG loads that file from MinIO only when you generate.
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-[2] space-y-2 min-w-0">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Select lesson source (uploaded file)
                </Label>
                {sourcesLoading ? (
                  <div className="flex h-9 items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading materials…
                  </div>
                ) : sources.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {sourcesError ??
                      "No materials yet. Upload PDF/DOCX/PPTX in Course Content or a lesson template."}
                  </p>
                ) : (
                  <select
                    value={lessonSource}
                    onChange={(e) => setLessonSource(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                  </select>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Questions
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="h-9"
                  disabled={generating}
                />
              </div>
              <Button
                variant="inverse"
                className="gap-1.5 font-bold h-9 shrink-0"
                disabled={generating || sourcesLoading || sources.length === 0}
                onClick={() => void handleGenerate()}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generating ? "Indexing & generating…" : "Generate Quiz"}
              </Button>
            </div>
            {generateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">{generateError}</p>
            )}
            {selectedSource && !sourcesLoading && (
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {selectedSource.kind === "library"
                  ? "Template material"
                  : "Class lesson material"}
                : {selectedSource.fileName}
              </p>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <Badge
                    className={cn(
                      "text-[10px] font-bold border-0",
                      quiz.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                    )}
                  >
                    {quiz.statusLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    {quiz.status === "pending" && (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {quiz.meta}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-[13px] text-muted-foreground mb-4">{quiz.description}</p>

                {quiz.status === "pending" && !isTeacher && (
                  <Button variant="inverse" className="w-full font-bold h-9">
                    Start Quiz
                  </Button>
                )}

                {quiz.status === "pending" && isTeacher && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 font-bold h-9"
                      onClick={() => generatedQuiz && setPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button variant="outline" className="flex-1 font-bold h-9">
                      Publish
                    </Button>
                  </div>
                )}

                {quiz.status === "completed" && (
                  <Button variant="outline" className="w-full font-bold h-9">
                    Review Answers
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated quiz preview</DialogTitle>
            <DialogDescription>
              {generatedQuiz
                ? `${generatedQuiz.questionCount} questions from ${generatedQuiz.sourceFileName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
              {generatedQuiz
                ? tryFormatQuizPreview(generatedQuiz.generatedContent)
                : ""}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
