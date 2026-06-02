"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Clock,
  Eye,
  FlaskConical,
  Loader2,
  MoreVertical,
  Sparkles,
  FileText,
  Trash2,
  Zap,
  Users,
  HelpCircle,
  BookOpen,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { quizService } from "@/lib/services/quiz-service";
import { classService } from "@/lib/services/class-service";
import {
  loadQuizMaterialSources,
  parseQuizMaterialSourceKey,
  type QuizMaterialSource,
} from "@/lib/quiz-material-sources";
import type { QuizGenerateDto } from "@/lib/types/lesson-ai-api";
import type { QuizDto } from "@/lib/types/quiz-api";
import type { ClassSummary } from "@/lib/types/class-api";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useQueryState } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { QuizTakingView } from "./QuizTakingView";

type UserRole = "student" | "teacher" | "admin";

interface ParsedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

function parseQuizQuestions(content: string): ParsedQuestion[] | null {
  try {
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = content.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ParsedQuestion[];
    }
  } catch {
    /* plain text / markdown from model — fall through */
  }
  return null;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

function QuizPreviewPanel({
  content,
  questions: preloaded,
}: {
  content?: string;
  questions?: ParsedQuestion[];
}) {
  const questions: ParsedQuestion[] | null =
    preloaded ??
    (content ? parseQuizQuestions(content) : null);

  if (!questions) {
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono text-foreground p-4">
        {content ?? ""}
      </pre>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden"
        >
          {/* Question header */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center mt-0.5">
              {qi + 1}
            </span>
            <p className="text-sm font-semibold text-foreground leading-snug">{q.question}</p>
          </div>

          {/* Options */}
          <div className="px-4 pb-3 space-y-2">
            {q.options.map((opt, oi) => {
              const isCorrect = oi === q.correctIndex;
              return (
                <div
                  key={oi}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/40"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                    )}
                  >
                    {OPTION_LABELS[oi] ?? oi}
                  </span>
                  <span
                    className={cn(
                      "flex-1",
                      isCorrect
                        ? "text-emerald-800 dark:text-emerald-300 font-medium"
                        : "text-foreground"
                    )}
                  >
                    {opt}
                  </span>
                  {isCorrect && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-3 py-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  generatedQuiz: QuizGenerateDto;
  onAssigned: () => void;
}

function AssignQuizDialog({
  open,
  onOpenChange,
  generatedQuiz,
  onAssigned,
}: AssignDialogProps) {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState(
    `Quiz: ${generatedQuiz.sourceFileName.replace(/\.[^.]+$/, "")}`
  );
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setClassesLoading(true);
    classService
      .listClasses({ size: 100 })
      .then((page) => {
        setClasses(page.items ?? []);
        if (page.items?.length > 0) setClassId(String(page.items[0].id));
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, [open]);

  const handleAssign = async () => {
    if (!classId || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await quizService.publish({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: Number(classId),
        generatedContent: generatedQuiz.generatedContent,
        questionCount: generatedQuiz.questionCount,
        durationMinutes: Number(duration) || 30,
      });
      onAssigned();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not publish quiz. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            Assign Quiz to Class
          </DialogTitle>
          <DialogDescription className="text-xs">
            Publish this AI-generated quiz so students in the selected class can take it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quiz title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 Quiz"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for students"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Assign to class</Label>
            {classesLoading ? (
              <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading classes…
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-amber-600">No classes found.</p>
            ) : (
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Time limit (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={180}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-3 py-2 text-xs text-muted-foreground">
            <strong>{generatedQuiz.questionCount} questions</strong> from{" "}
            <span className="font-medium">{generatedQuiz.sourceFileName}</span>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !classId || !title.trim()}
            onClick={() => void handleAssign()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Publish to Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MyTasksView() {
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as UserRole) ?? "student";
  const isTeacher = role === "teacher" || role === "admin";

  /* ── AI generator state ── */
  const [sources, setSources] = useState<QuizMaterialSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [lessonSource, setLessonSource] = useQueryState(QueryKey.lessonSource, "");
  const [questionCount, setQuestionCount] = useQueryState(QueryKey.questions, "10");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizGenerateDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  /* ── Quiz list state ── */
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  /* ── Active quiz taking ── */
  const [activeQuiz, setActiveQuiz] = useState<QuizDto | null>(null);

  /* ── Published quiz preview / delete / assign ── */
  const [publishedPreviewOpen, setPublishedPreviewOpen] = useState(false);
  const [publishedPreviewLoading, setPublishedPreviewLoading] = useState(false);
  const [publishedPreviewQuiz, setPublishedPreviewQuiz] = useState<QuizDto | null>(null);
  const [assignFromCardOpen, setAssignFromCardOpen] = useState(false);
  const [assignFromCardQuiz, setAssignFromCardQuiz] = useState<QuizDto | null>(null);
  const { confirm } = useConfirm();

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

  const loadQuizzes = useCallback(async () => {
    setQuizzesLoading(true);
    setQuizzesError(null);
    try {
      const list = isTeacher
        ? await quizService.listForClass().catch(() => [] as QuizDto[])
        : await quizService.listAssigned().catch(() => [] as QuizDto[]);
      setQuizzes(list);
    } catch {
      setQuizzes([]);
    } finally {
      setQuizzesLoading(false);
    }
  }, [isTeacher]);

  const handlePreviewPublishedQuiz = useCallback(async (quizId: number) => {
    setPublishedPreviewLoading(true);
    setPublishedPreviewOpen(true);
    setPublishedPreviewQuiz(null);
    try {
      const full = await quizService.getQuiz(quizId);
      setPublishedPreviewQuiz(full);
    } catch (err) {
      setPublishedPreviewOpen(false);
      console.error(
        "Failed to load quiz preview:",
        getApiErrorMessage(err, "Could not load quiz preview.")
      );
    } finally {
      setPublishedPreviewLoading(false);
    }
  }, []);

  const handleDeletePublishedQuiz = useCallback(async (quiz: QuizDto) => {
    const ok = await confirm(
      `"${quiz.title}" will be permanently removed and students will no longer be able to take it.`,
      { title: "Delete quiz?", confirmLabel: "Delete", variant: "destructive" }
    );
    if (!ok) return;
    try {
      await quizService.delete(quiz.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
    } catch (err) {
      console.error("Failed to delete quiz:", getApiErrorMessage(err, "Could not delete quiz."));
    }
  }, [confirm]);

  const handleAssignFromCard = useCallback(async (quizId: number) => {
    try {
      const full = await quizService.getQuiz(quizId);
      setAssignFromCardQuiz(full);
      setAssignFromCardOpen(true);
    } catch (err) {
      console.error(
        "Failed to load quiz for reassignment:",
        getApiErrorMessage(err, "Could not load quiz for assignment.")
      );
    }
  }, []);

  useEffect(() => {
    if (isTeacher) void loadSources();
  }, [isTeacher, loadSources]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

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
      } else if (selectedSource.kind === "library-content" && selectedSource.libraryItemId != null) {
        result = await lessonAiService.generateQuizFromLibraryContent(
          selectedSource.libraryItemId,
          { questionCount: count }
        );
      } else if (selectedSource.kind === "library" && selectedSource.libraryItemId != null) {
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
    } catch (err) {
      setGenerateError(
        getApiErrorMessage(err, "") ||
        "Quiz generation failed. Make sure Ollama is running and the model is pulled."
      );
    } finally {
      setGenerating(false);
    }
  };

  /* ── Quiz taking (student) ── */
  if (activeQuiz) {
    return (
      <QuizTakingView
        quiz={activeQuiz}
        onExit={() => {
          setActiveQuiz(null);
          void loadQuizzes();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quizzes
            <FlaskConical className="w-5 h-5 text-violet-500" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTeacher
              ? "Generate AI quizzes and assign them to your classes."
              : "Complete your assigned quizzes."}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* ── AI Generator (teacher only) ── */}
        {isTeacher && (
          <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                  AI Quiz Generator
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Generate a quiz from lesson materials, then assign it to any of your classes.
                </p>
              </div>
            </div>
            <div             className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-2 space-y-2 min-w-0">
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
                {generating ? "Generating…" : "Generate Quiz"}
              </Button>
            </div>
            {generateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">{generateError}</p>
            )}
            {selectedSource && !sourcesLoading && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {selectedSource.kind === "library-content"
                    ? "Template written notes"
                    : selectedSource.kind === "library"
                      ? "Template uploaded file"
                      : "Class lesson file"}
                  : {selectedSource.fileName}
                </p>
              </div>
            )}
            {generatedQuiz && (
              <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                    {generatedQuiz.questionCount} questions ready — review and publish to a class
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => setAssignOpen(true)}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Assign to Class
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Quiz list ── */}
        <div>
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-tight text-zinc-700 dark:text-zinc-300 mb-3">
            {isTeacher ? "Published Quizzes" : "My Quizzes"}
          </h2>

          {quizzesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : quizzesError ? (
            <p className="text-sm text-destructive">{quizzesError}</p>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
              <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {isTeacher
                  ? "No published quizzes yet. Generate one above and assign it to a class."
                  : "No quizzes assigned yet. Check back when your teacher publishes one."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isTeacher={isTeacher}
                  onStart={() => setActiveQuiz(quiz)}
                  onCardClick={isTeacher ? () => void handlePreviewPublishedQuiz(quiz.id) : undefined}
                  onAssign={() => void handleAssignFromCard(quiz.id)}
                  onDelete={() => void handleDeletePublishedQuiz(quiz)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[88vw]! max-w-6xl! max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-500" />
                Quiz Preview
              </DialogTitle>
              {generatedQuiz && (
                <DialogDescription className="text-xs mt-1">
                  <span className="font-semibold text-foreground">{generatedQuiz.questionCount} questions</span>
                  {" · "}generated from{" "}
                  <span className="font-medium">{generatedQuiz.sourceFileName}</span>
                </DialogDescription>
              )}
            </div>
            {/* Summary badge */}
            {generatedQuiz && (
              <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-3 py-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                  {generatedQuiz.questionCount} Q&apos;s
                </span>
              </div>
            )}
          </div>

          {/* Scrollable question list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-slate-50/50 dark:bg-zinc-950/50">
            {generatedQuiz && <QuizPreviewPanel content={generatedQuiz.generatedContent} />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold"
              onClick={() => {
                setPreviewOpen(false);
                setAssignOpen(true);
              }}
            >
              <Users className="w-4 h-4" />
              Assign to Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      {generatedQuiz && (
        <AssignQuizDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          generatedQuiz={generatedQuiz}
          onAssigned={() => {
            setGeneratedQuiz(null);
            void loadQuizzes();
          }}
        />
      )}

      {/* Assign-from-card dialog: republish an existing quiz to another class */}
      {assignFromCardQuiz?.generatedContent && (
        <AssignQuizDialog
          open={assignFromCardOpen}
          onOpenChange={(open) => {
            setAssignFromCardOpen(open);
            if (!open) setAssignFromCardQuiz(null);
          }}
          generatedQuiz={{
            lessonId: null,
            materialId: null,
            sourceFileName: assignFromCardQuiz.title,
            questionCount: assignFromCardQuiz.questionCount,
            generatedContent: assignFromCardQuiz.generatedContent,
          }}
          onAssigned={() => {
            setAssignFromCardOpen(false);
            setAssignFromCardQuiz(null);
            void loadQuizzes();
          }}
        />
      )}

      {/* Published quiz preview dialog */}
      <Dialog open={publishedPreviewOpen} onOpenChange={setPublishedPreviewOpen}>
        <DialogContent className="w-[88vw]! max-w-6xl! max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-500" />
                {publishedPreviewQuiz?.title ?? "Quiz Preview"}
              </DialogTitle>
              {publishedPreviewQuiz && (
                <DialogDescription className="text-xs mt-1">
                  <span className="font-semibold text-foreground">
                    {publishedPreviewQuiz.questionCount} questions
                  </span>
                  {" · "}
                  {publishedPreviewQuiz.className}
                  {publishedPreviewQuiz.durationMinutes
                    ? ` · ${publishedPreviewQuiz.durationMinutes} min`
                    : ""}
                </DialogDescription>
              )}
            </div>
            {publishedPreviewQuiz && (
              <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-3 py-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                  {publishedPreviewQuiz.questionCount} Q&apos;s
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-slate-50/50 dark:bg-zinc-950/50">
            {publishedPreviewLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : publishedPreviewQuiz?.questions ? (
              <QuizPreviewPanel
                questions={publishedPreviewQuiz.questions.map((q) => ({
                  question: q.question,
                  options: q.options,
                  correctIndex: q.correctIndex ?? 0,
                  explanation: q.explanation ?? undefined,
                }))}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <Button variant="outline" size="sm" onClick={() => setPublishedPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuizCard({
  quiz,
  isTeacher,
  onStart,
  onCardClick,
  onAssign,
  onDelete,
}: {
  quiz: QuizDto;
  isTeacher: boolean;
  onStart: () => void;
  onCardClick?: () => void;
  onAssign?: () => void;
  onDelete?: () => void;
}) {
  const isPending = quiz.status === "PUBLISHED";
  const isClosed = quiz.status === "CLOSED";

  return (
    <Card
      className={cn(
        "border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs transition-colors",
        isTeacher
          ? "hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md cursor-pointer"
          : "hover:border-slate-300 dark:hover:border-zinc-700"
      )}
      onClick={onCardClick}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          <Badge
            className={cn(
              "text-[10px] font-bold border-0",
              isPending
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isClosed
                  ? "bg-slate-500/10 text-muted-foreground"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
            )}
          >
            {quiz.status === "PUBLISHED"
              ? "Active"
              : quiz.status === "DRAFT"
                ? "Draft"
                : "Closed"}
          </Badge>
          <div className="flex items-center gap-1 shrink-0">
            {quiz.durationMinutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {quiz.durationMinutes} min
              </span>
            )}
            {isTeacher && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="Quiz options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onAssign?.(); }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign to Class
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1 leading-snug">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="text-[13px] text-muted-foreground mb-1">{quiz.description}</p>
        )}
        <p className="text-xs text-muted-foreground mb-4">
          {quiz.className} · {quiz.questionCount} questions
        </p>

        {isTeacher && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            Click to preview
          </div>
        )}
        {!isTeacher && isPending && (
          <Button
            variant="inverse"
            className="w-full font-bold h-9"
            onClick={(e) => { e.stopPropagation(); onStart(); }}
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Start Quiz
          </Button>
        )}
        {!isTeacher && !isPending && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {isClosed ? "Quiz closed" : "Completed"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
