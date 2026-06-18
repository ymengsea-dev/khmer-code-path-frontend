"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CheckCircle,
  Clock,
  FlaskConical,
  Loader2,
  MoreVertical,
  Plus,
  Save,
  Sparkles,
  FileText,
  Trash2,
  X,
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
import type { QuizDto, QuizResults, QuizSummary } from "@/lib/types/quiz-api";
import type { ClassSummary } from "@/lib/types/class-api";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useQueryState } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { QuizTakingView } from "./QuizTakingView";
import {
  BouncyStagger,
  BouncyStaggerItem,
} from "@/components/motion";
import { glassBtnSubtleClass } from "@/components/ui/glass-field";

type UserRole = "student" | "teacher" | "admin";
type QuizViewMode = "list" | "detail" | "edit";

const QUIZ_CARD_GRADIENTS = [
  "from-violet-500 via-purple-500 to-fuchsia-600",
  "from-indigo-500 via-blue-500 to-cyan-600",
  "from-emerald-500 via-teal-500 to-green-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-rose-500 via-pink-500 to-violet-600",
  "from-sky-500 via-indigo-500 to-violet-600",
];

function quizCardGradient(quizId: number): string {
  return QUIZ_CARD_GRADIENTS[quizId % QUIZ_CARD_GRADIENTS.length];
}

interface ParsedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

function parseQuizQuestions(content: string): ParsedQuestion[] | null {
  try {
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = content
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
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

function normalizeQuestion(question: ParsedQuestion): ParsedQuestion {
  const rawOptions = Array.isArray(question.options)
    ? question.options.map(String)
    : [];
  const options = rawOptions.length >= 2 ? rawOptions : ["", ""];
  return {
    question: String(question.question ?? ""),
    options,
    correctIndex: Math.min(
      Math.max(question.correctIndex ?? 0, 0),
      options.length - 1,
    ),
    explanation:
      question.explanation != null ? String(question.explanation) : "",
  };
}

function serializeQuizQuestions(questions: ParsedQuestion[]): string {
  return JSON.stringify(questions.map(normalizeQuestion), null, 2);
}

function QuizPreviewPanel({
  content,
  questions: preloaded,
}: {
  content?: string;
  questions?: ParsedQuestion[];
}) {
  const questions: ParsedQuestion[] | null =
    preloaded ?? (content ? parseQuizQuestions(content) : null);

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
            <p className="text-sm font-semibold text-foreground leading-snug">
              {q.question}
            </p>
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
                      : "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/40",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300",
                    )}
                  >
                    {OPTION_LABELS[oi] ?? oi}
                  </span>
                  <span
                    className={cn(
                      "flex-1",
                      isCorrect
                        ? "text-emerald-800 dark:text-emerald-300 font-medium"
                        : "text-foreground",
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
              <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                {q.explanation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditableQuizPanel({
  content,
  onQuestionsChange,
}: {
  content: string;
  onQuestionsChange: (questions: ParsedQuestion[]) => void;
}) {
  const questions = (parseQuizQuestions(content) ?? []).map(normalizeQuestion);

  const updateQuestions = (next: ParsedQuestion[]) => {
    onQuestionsChange(next.map(normalizeQuestion));
  };

  const updateQuestion = (
    index: number,
    updater: (question: ParsedQuestion) => ParsedQuestion,
  ) => {
    updateQuestions(
      questions.map((question, qi) =>
        qi === index ? updater(question) : question,
      ),
    );
  };

  if (questions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-600">
          This quiz could not be parsed into editable questions. You can still
          review the raw output below.
        </p>
        <pre className="text-xs whitespace-pre-wrap font-mono text-foreground p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center mt-1">
                {qi + 1}
              </span>
              <textarea
                value={q.question}
                onChange={(event) =>
                  updateQuestion(qi, (current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
                rows={2}
                className="min-h-16 flex-1 resize-y rounded-lg border border-slate-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-semibold text-foreground"
                placeholder="Question"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              disabled={questions.length <= 1}
              onClick={() =>
                updateQuestions(questions.filter((_, index) => index !== qi))
              }
              aria-label="Remove question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 py-4 space-y-3">
            {q.options.map((option, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateQuestion(qi, (current) => ({
                      ...current,
                      correctIndex: oi,
                    }))
                  }
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full text-xs font-bold flex items-center justify-center border",
                    oi === q.correctIndex
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-background text-muted-foreground border-slate-200 dark:border-zinc-800",
                  )}
                  title="Mark as correct answer"
                >
                  {OPTION_LABELS[oi] ?? oi + 1}
                </button>
                <Input
                  value={option}
                  onChange={(event) =>
                    updateQuestion(qi, (current) => ({
                      ...current,
                      options: current.options.map((value, index) =>
                        index === oi ? event.target.value : value,
                      ),
                    }))
                  }
                  placeholder={`Option ${OPTION_LABELS[oi] ?? oi + 1}`}
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={q.options.length <= 2}
                  onClick={() =>
                    updateQuestion(qi, (current) => {
                      const nextOptions = current.options.filter(
                        (_, index) => index !== oi,
                      );
                      return {
                        ...current,
                        options: nextOptions,
                        correctIndex:
                          current.correctIndex === oi
                            ? 0
                            : current.correctIndex > oi
                              ? current.correctIndex - 1
                              : current.correctIndex,
                      };
                    })
                  }
                  aria-label="Remove option"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={q.options.length >= 6}
              onClick={() =>
                updateQuestion(qi, (current) => ({
                  ...current,
                  options: [...current.options, ""],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </Button>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Explanation
              </Label>
              <textarea
                value={q.explanation ?? ""}
                onChange={(event) =>
                  updateQuestion(qi, (current) => ({
                    ...current,
                    explanation: event.target.value,
                  }))
                }
                rows={2}
                className="w-full resize-y rounded-lg border border-slate-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Explain why the correct answer is right"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() =>
          updateQuestions([
            ...questions,
            {
              question: "New question",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctIndex: 0,
              explanation: "",
            },
          ])
        }
      >
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
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
    `Quiz: ${generatedQuiz.sourceFileName.replace(/\.[^.]+$/, "")}`,
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
      setError(
        getApiErrorMessage(err, "Could not publish quiz. Please try again."),
      );
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
            Publish this AI-generated quiz so students in the selected class can
            take it.
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
            <Label className="text-xs font-semibold">
              Description (optional)
            </Label>
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading
                classes…
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
            <Label className="text-xs font-semibold">
              Time limit (minutes)
            </Label>
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
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : null}
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
  const [lessonSource, setLessonSource] = useQueryState(
    QueryKey.lessonSource,
    "",
  );
  const [questionCount, setQuestionCount] = useQueryState(
    QueryKey.questions,
    "10",
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizGenerateDto | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  /* ── Quiz list state ── */
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  /* ── Summary stats state ── */
  const [summary, setSummary] = useState<QuizSummary | null>(null);

  /* ── Active quiz taking ── */
  const [activeQuiz, setActiveQuiz] = useState<QuizDto | null>(null);

  /* ── Published quiz detail / edit ── */
  const [quizViewMode, setQuizViewMode] = useState<QuizViewMode>("list");
  const [publishedPreviewLoading, setPublishedPreviewLoading] = useState(false);
  const [publishedPreviewQuiz, setPublishedPreviewQuiz] =
    useState<QuizDto | null>(null);
  const [assignFromCardOpen, setAssignFromCardOpen] = useState(false);
  const [assignFromCardQuiz, setAssignFromCardQuiz] = useState<QuizDto | null>(
    null,
  );
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizDto | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("30");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const { confirm, alert } = useConfirm();

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
        "Could not load lesson materials. Upload files in Content Management or a lesson template first.",
      );
    } finally {
      setSourcesLoading(false);
    }
  }, [lessonSource, setLessonSource]);

  const loadQuizzes = useCallback(async () => {
    setQuizzesLoading(true);
    setQuizzesError(null);
    try {
      const [list, stats] = await Promise.all([
        isTeacher
          ? quizService.listForClass().catch(() => [] as QuizDto[])
          : quizService.listAssigned().catch(() => [] as QuizDto[]),
        quizService.getSummary().catch(() => null),
      ]);
      setQuizzes(list);
      setSummary(stats);
    } catch {
      setQuizzes([]);
    } finally {
      setQuizzesLoading(false);
    }
  }, [isTeacher]);

  const handleViewPublishedQuiz = useCallback(async (quizId: number) => {
    setPublishedPreviewLoading(true);
    setQuizViewMode("detail");
    setPublishedPreviewQuiz(null);
    try {
      const full = await quizService.getQuiz(quizId);
      setPublishedPreviewQuiz(full);
    } catch (err) {
      setQuizViewMode("list");
      console.error(
        "Failed to load quiz:",
        getApiErrorMessage(err, "Could not load quiz."),
      );
    } finally {
      setPublishedPreviewLoading(false);
    }
  }, []);

  const closeQuizDetail = useCallback(() => {
    setQuizViewMode("list");
    setPublishedPreviewQuiz(null);
    setEditingQuiz(null);
  }, []);

  const handleDeletePublishedQuiz = useCallback(
    async (quiz: QuizDto) => {
      const ok = await confirm(
        `"${quiz.title}" will be permanently removed and students will no longer be able to take it.`,
        {
          title: "Delete quiz?",
          confirmLabel: "Delete",
          variant: "destructive",
        },
      );
      if (!ok) return;
      try {
        await quizService.delete(quiz.id);
        setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
        if (publishedPreviewQuiz?.id === quiz.id) {
          closeQuizDetail();
        }
      } catch (err) {
        console.error(
          "Failed to delete quiz:",
          getApiErrorMessage(err, "Could not delete quiz."),
        );
      }
    },
    [confirm, closeQuizDetail, publishedPreviewQuiz?.id],
  );

  const handleAssignFromCard = useCallback(async (quizId: number) => {
    try {
      const full = await quizService.getQuiz(quizId);
      setAssignFromCardQuiz(full);
      setAssignFromCardOpen(true);
    } catch (err) {
      console.error(
        "Failed to load quiz for reassignment:",
        getApiErrorMessage(err, "Could not load quiz for assignment."),
      );
    }
  }, []);

  const handleReviewResults = useCallback(
    async (quizId: number) => {
      setResultsOpen(true);
      setResultsLoading(true);
      setQuizResults(null);
      try {
        const results = await quizService.getResults(quizId);
        setQuizResults(results);
      } catch (err) {
        setResultsOpen(false);
        void alert(getApiErrorMessage(err, "Could not load quiz results."), {
          title: "Quiz results error",
          variant: "destructive",
        });
        console.error(
          "Failed to load quiz results:",
          getApiErrorMessage(err, "Could not load quiz results."),
        );
      } finally {
        setResultsLoading(false);
      }
    },
    [alert],
  );

  const populateEditState = useCallback((full: QuizDto) => {
    const content =
      full.generatedContent ??
      serializeQuizQuestions(
        (full.questions ?? []).map((q) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex ?? 0,
          explanation: q.explanation ?? "",
        })),
      );
    setEditingQuiz(full);
    setEditTitle(full.title);
    setEditDescription(full.description ?? "");
    setEditDuration(String(full.durationMinutes ?? 30));
    setEditContent(content);
  }, []);

  const handleEditPublishedQuiz = useCallback(
    async (quiz: QuizDto) => {
      if ((quiz.submittedCount ?? 0) > 0 || (quiz.failedCount ?? 0) > 0) {
        void alert(
          "This quiz already has student attempts. Duplicate and edit it instead.",
          {
            title: "Cannot edit quiz",
            variant: "info",
          },
        );
        return;
      }
      try {
        if (
          publishedPreviewQuiz?.id === quiz.id &&
          (publishedPreviewQuiz.questions?.length ||
            publishedPreviewQuiz.generatedContent)
        ) {
          populateEditState(publishedPreviewQuiz);
        } else {
          const full = await quizService.getQuiz(quiz.id);
          setPublishedPreviewQuiz(full);
          populateEditState(full);
        }
        setQuizViewMode("edit");
      } catch (err) {
        void alert(
          getApiErrorMessage(err, "Could not load quiz for editing."),
          {
            title: "Edit quiz error",
            variant: "destructive",
          },
        );
      }
    },
    [alert, populateEditState, publishedPreviewQuiz],
  );

  const handleSavePublishedQuiz = useCallback(async () => {
    if (!editingQuiz) return;
    const questions = parseQuizQuestions(editContent) ?? [];
    if (questions.length === 0) {
      void alert(
        "Quiz questions are not valid. Please add at least one question.",
        {
          title: "Invalid quiz",
          variant: "destructive",
        },
      );
      return;
    }
    setEditSaving(true);
    try {
      await quizService.update(editingQuiz.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        durationMinutes: Number(editDuration) || null,
        questionCount: questions.length,
        generatedContent: serializeQuizQuestions(questions),
      });
      const refreshed = await quizService.getQuiz(editingQuiz.id);
      setPublishedPreviewQuiz(refreshed);
      setEditingQuiz(null);
      setQuizViewMode("detail");
      await loadQuizzes();
      void alert("Quiz updated successfully.", {
        title: "Saved",
        variant: "success",
      });
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not update quiz."), {
        title: "Save failed",
        variant: "destructive",
      });
    } finally {
      setEditSaving(false);
    }
  }, [
    alert,
    editContent,
    editDescription,
    editDuration,
    editTitle,
    editingQuiz,
    loadQuizzes,
  ]);

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
        result = await lessonAiService.generateQuizFromLesson(
          selectedSource.lessonId,
          {
            materialId: selectedSource.materialId,
            questionCount: count,
          },
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
      setGeneratedQuiz(result);
      setPreviewOpen(true);
    } catch (err) {
      setGenerateError(
        getApiErrorMessage(err, "") ||
          "Quiz generation failed. Make sure Ollama is running and the model is pulled.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratedQuestionsChange = useCallback(
    (questions: ParsedQuestion[]) => {
      setGeneratedQuiz((prev) =>
        prev
          ? {
              ...prev,
              questionCount: questions.length,
              generatedContent: serializeQuizQuestions(questions),
            }
          : prev,
      );
    },
    [],
  );

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

  const canEditCurrentQuiz =
    publishedPreviewQuiz != null &&
    (publishedPreviewQuiz.submittedCount ?? 0) === 0 &&
    (publishedPreviewQuiz.failedCount ?? 0) === 0;

  if (quizViewMode === "detail" || quizViewMode === "edit") {
    const activeQuizDetail = publishedPreviewQuiz ?? editingQuiz;
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div className="shrink-0 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (quizViewMode === "edit") {
                setQuizViewMode("detail");
                setEditingQuiz(null);
              } else {
                closeQuizDetail();
              }
            }}
            className={cn(glassBtnSubtleClass, "h-8 px-3 text-xs font-semibold gap-1.5")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {quizViewMode === "edit" ? "Back to quiz" : "Back to Quizzes"}
          </button>
          {quizViewMode === "detail" && activeQuizDetail && isTeacher && canEditCurrentQuiz && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs rounded-xl"
              onClick={() => void handleEditPublishedQuiz(activeQuizDetail)}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Edit quiz
            </Button>
          )}
          {quizViewMode === "edit" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-xl"
                onClick={() => {
                  setQuizViewMode("detail");
                  setEditingQuiz(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs rounded-xl"
                disabled={editSaving || !editTitle.trim()}
                onClick={() => void handleSavePublishedQuiz()}
              >
                {editSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save changes
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {publishedPreviewLoading && !activeQuizDetail ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : quizViewMode === "detail" && activeQuizDetail ? (
            <div
              className="rounded-2xl overflow-hidden flex flex-col min-h-full"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border-color)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div className="shrink-0 px-5 py-4 border-b border-black/6 dark:border-white/8">
                <h2 className="text-base font-extrabold text-foreground">
                  {activeQuizDetail.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeQuizDetail.className}
                  {" · "}
                  {activeQuizDetail.questionCount} questions
                  {activeQuizDetail.durationMinutes
                    ? ` · ${activeQuizDetail.durationMinutes} min`
                    : ""}
                </p>
                {activeQuizDetail.description ? (
                  <p className="text-sm text-muted-foreground/90 mt-2 leading-relaxed">
                    {activeQuizDetail.description}
                  </p>
                ) : null}
              </div>
              <div className="flex-1 px-5 py-4">
                {activeQuizDetail.questions?.length ? (
                  <QuizPreviewPanel
                    questions={activeQuizDetail.questions.map((q) => ({
                      question: q.question,
                      options: q.options,
                      correctIndex: q.correctIndex ?? 0,
                      explanation: q.explanation ?? undefined,
                    }))}
                  />
                ) : (
                  <QuizPreviewPanel content={activeQuizDetail.generatedContent ?? ""} />
                )}
              </div>
            </div>
          ) : quizViewMode === "edit" && editingQuiz ? (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border-color)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Quiz title</Label>
                  <Input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Time limit (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={(event) => setEditDuration(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Optional description"
                />
              </div>
              {editContent ? (
                <EditableQuizPanel
                  content={editContent}
                  onQuestionsChange={(questions) =>
                    setEditContent(serializeQuizQuestions(questions))
                  }
                />
              ) : (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ) : null}
        </div>

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
      </div>
    );
  }

  /* ── Summary stats (from backend) ── */
  const summaryStats = summary
    ? isTeacher
      ? [
          {
            label: "Quizzes",
            value: String(summary.total),
            sub: "published",
            color: "#305FC9",
            bg: "rgba(48,95,201,0.08)",
          },
          {
            label: "Submissions",
            value: String(summary.totalSubmissions),
            sub: "across all quizzes",
            color: "#16a34a",
            bg: "rgba(22,163,74,0.08)",
          },
          {
            label: "Failed",
            value: String(summary.totalFailed),
            sub: "student attempts",
            color: "#dc2626",
            bg: "rgba(220,38,38,0.08)",
          },
          {
            label: "Questions",
            value: String(summary.totalQuestions),
            sub: "total",
            color: "#7c3aed",
            bg: "rgba(124,58,237,0.08)",
          },
        ]
      : [
          {
            label: "Total",
            value: String(summary.total),
            sub: "assigned quizzes",
            color: "#305FC9",
            bg: "rgba(48,95,201,0.08)",
          },
          {
            label: "Pending",
            value: String(summary.pending),
            sub: "not yet started",
            color: "#d97706",
            bg: "rgba(217,119,6,0.08)",
          },
          {
            label: "Completed",
            value: String(summary.completed),
            sub: "submitted",
            color: "#16a34a",
            bg: "rgba(22,163,74,0.08)",
          },
          {
            label: "Missed",
            value: String(summary.missed),
            sub: "failed or closed",
            color: "#dc2626",
            bg: "rgba(220,38,38,0.08)",
          },
        ]
    : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-5">
        {/* ── Summary stat cards ── */}
        {!quizzesLoading && summary !== null && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  {stat.value}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {stat.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {stat.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI Generator (teacher only) ── */}
        {isTeacher && (
          <section
            className="rounded-2xl p-5"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              border: "1px solid var(--glass-border-color)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "none",
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#305FC9" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  AI Quiz Generator
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Generate a quiz from lesson materials, then assign it to any
                  of your classes.
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
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
                      "No materials yet. Upload PDF/DOCX/PPTX in Content Management or a lesson template."}
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
              <button
                type="button"
                disabled={generating || sourcesLoading || sources.length === 0}
                onClick={() => void handleGenerate()}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 shrink-0"
                style={{
                  background: "#305FC9",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(48,95,201,0.25)",
                }}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generating ? "Generating…" : "Generate Quiz"}
              </button>
            </div>
            {generateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">
                {generateError}
              </p>
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
              <div
                className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "none",
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-foreground truncate">
                    {generatedQuiz.questionCount} questions ready — review and
                    publish to a class
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "var(--glass-bg)",
                      border: "1px solid rgba(0,0,0,0.10)",
                      boxShadow: "none",
                    }}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Edit Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignOpen(true)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{
                      background: "#305FC9",
                      boxShadow: "0 1px 6px rgba(48,95,201,0.25)",
                    }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Assign to Class
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Quiz list ── */}
        <div>
          {quizzesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : quizzesError ? (
            <p className="text-sm text-destructive">{quizzesError}</p>
          ) : quizzes.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl flex flex-col items-center gap-3"
              style={{
                background: "var(--glass-bg-subtle)",
                border: "1px solid var(--glass-border-color)",
                boxShadow: "none",
              }}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "none",
                }}
              >
                <FlaskConical className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isTeacher
                  ? "No published quizzes yet. Generate one above and assign it to a class."
                  : "No quizzes assigned yet. Check back when your teacher publishes one."}
              </p>
            </div>
          ) : (
            <BouncyStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <BouncyStaggerItem key={quiz.id} enter="simple">
                  <QuizCard
                    quiz={quiz}
                    isTeacher={isTeacher}
                    onStart={() => setActiveQuiz(quiz)}
                    onView={() => void handleViewPublishedQuiz(quiz.id)}
                    onReview={() => void handleReviewResults(quiz.id)}
                    onAssign={() => void handleAssignFromCard(quiz.id)}
                    onDelete={() => void handleDeletePublishedQuiz(quiz)}
                  />
                </BouncyStaggerItem>
              ))}
            </BouncyStagger>
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
                Edit Generated Quiz
              </DialogTitle>
              {generatedQuiz && (
                <DialogDescription className="text-xs mt-1">
                  <span className="font-semibold text-foreground">
                    {generatedQuiz.questionCount} questions
                  </span>
                  {" · "}generated from{" "}
                  <span className="font-medium">
                    {generatedQuiz.sourceFileName}
                  </span>
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

          {/* Scrollable editable question list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-slate-50/50 dark:bg-zinc-950/50">
            {generatedQuiz && (
              <EditableQuizPanel
                content={generatedQuiz.generatedContent}
                onQuestionsChange={handleGeneratedQuestionsChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(false)}
            >
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

      {/* Teacher quiz results dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="w-[90vw]! max-w-6xl! max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              Quiz Results
            </DialogTitle>
            {quizResults ? (
              <DialogDescription className="text-xs mt-1">
                <span className="font-semibold text-foreground">
                  {quizResults.quiz.title}
                </span>
                {" · "}
                {quizResults.quiz.className}
              </DialogDescription>
            ) : null}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-slate-50/50 dark:bg-zinc-950/50">
            {resultsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : quizResults ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Enrolled", quizResults.enrolledStudents],
                    ["Submitted", quizResults.submittedCount],
                    ["Failed", quizResults.failedCount],
                    ["Not started", quizResults.notStartedCount],
                    ["Average", `${quizResults.averageScorePercent}%`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-3"
                    >
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-black text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
                  <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] gap-3 px-4 py-3 text-xs font-bold text-muted-foreground border-b border-slate-100 dark:border-zinc-800">
                    <span>Student</span>
                    <span>Status</span>
                    <span>Score</span>
                    <span>Submitted</span>
                  </div>
                  {quizResults.submissions.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                      No student submissions yet.
                    </p>
                  ) : (
                    quizResults.submissions.map((submission) => (
                      <div
                        key={submission.submissionId}
                        className="border-b last:border-b-0 border-slate-100 dark:border-zinc-800"
                      >
                        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] gap-3 px-4 py-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {submission.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {submission.studentEmail}
                            </p>
                          </div>
                          <div>
                            <Badge
                              className={cn(
                                "text-[10px] font-bold border-0",
                                submission.status === "SUBMITTED"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {submission.status}
                            </Badge>
                            {submission.failReason ? (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {submission.failReason}
                              </p>
                            ) : null}
                          </div>
                          <p className="font-semibold text-foreground">
                            {submission.score ?? "—"} /{" "}
                            {submission.totalQuestions}
                            {submission.scorePercent != null ? (
                              <span className="block text-xs text-muted-foreground">
                                {submission.scorePercent}%
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {submission.submittedAt
                              ? new Date(
                                  submission.submittedAt,
                                ).toLocaleString()
                              : "—"}
                          </p>
                        </div>

                        {submission.wrongAnswers.length > 0 ? (
                          <div className="mx-4 mb-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-3 space-y-3">
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                              Wrong / unanswered questions (
                              {submission.wrongAnswers.length})
                            </p>
                            {submission.wrongAnswers.map((wrong, index) => (
                              <div
                                key={`${submission.submissionId}-${wrong.questionId}`}
                                className="rounded-lg bg-white dark:bg-zinc-950/70 border border-rose-100 dark:border-rose-900/50 p-3"
                              >
                                <p className="text-sm font-semibold text-foreground">
                                  {index + 1}. {wrong.question}
                                </p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                                  <div className="rounded-md bg-rose-500/10 px-2 py-1.5">
                                    <span className="font-bold text-rose-700 dark:text-rose-300">
                                      Student answer:
                                    </span>{" "}
                                    <span className="text-foreground">
                                      {wrong.selectedAnswer ?? "Not answered"}
                                    </span>
                                  </div>
                                  <div className="rounded-md bg-emerald-500/10 px-2 py-1.5">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                      Correct answer:
                                    </span>{" "}
                                    <span className="text-foreground">
                                      {wrong.correctAnswer ?? "—"}
                                    </span>
                                  </div>
                                </div>
                                {wrong.explanation ? (
                                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                    {wrong.explanation}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : submission.status === "SUBMITTED" ? (
                          <div className="mx-4 mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            All answers correct.
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResultsOpen(false)}
            >
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
  onView,
  onReview,
  onAssign,
  onDelete,
}: {
  quiz: QuizDto;
  isTeacher: boolean;
  onStart: () => void;
  onView?: () => void;
  onReview?: () => void;
  onAssign?: () => void;
  onDelete?: () => void;
}) {
  const isPending = quiz.status === "PUBLISHED";
  const isClosed = quiz.status === "CLOSED";
  const statusLabel =
    quiz.status === "PUBLISHED"
      ? "Active"
      : quiz.status === "DRAFT"
        ? "Draft"
        : "Closed";
  const gradient = quizCardGradient(quiz.id);

  return (
    <Card
      bouncy={false}
      className="border border-slate-200/80 dark:border-zinc-800/80 hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md flex flex-col overflow-hidden h-full"
    >
      <div
        className={`h-24 bg-linear-to-br ${gradient} relative overflow-hidden flex items-center justify-center`}
      >
        <div className="absolute inset-0 bg-black/10" />
        <FlaskConical className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Badge
            className={
              isPending
                ? "bg-emerald-500 text-white font-bold"
                : isClosed
                  ? "bg-zinc-600 text-white font-bold"
                  : "bg-amber-500 text-white font-bold"
            }
          >
            {statusLabel}
          </Badge>
          {quiz.durationMinutes ? (
            <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {quiz.durationMinutes}m
            </span>
          ) : null}
        </div>
        <h3 className="font-extrabold text-sm text-white text-center px-4 leading-tight drop-shadow-md line-clamp-2">
          {quiz.title}
        </h3>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold flex-wrap">
            <span className="flex items-center gap-1 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{quiz.className}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
              {quiz.questionCount} questions
            </span>
          </div>
          {quiz.description ? (
            <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
              {quiz.description}
            </p>
          ) : null}

          {isTeacher && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                {
                  label: "Submitted",
                  value: `${quiz.submittedCount ?? 0}${quiz.enrolledStudents != null ? ` / ${quiz.enrolledStudents}` : ""}`,
                },
                { label: "Failed", value: String(quiz.failedCount ?? 0) },
                {
                  label: "Pending",
                  value:
                    quiz.enrolledStudents != null
                      ? String(
                          Math.max(
                            0,
                            quiz.enrolledStudents -
                              (quiz.submittedCount ?? 0) -
                              (quiz.failedCount ?? 0),
                          ),
                        )
                      : "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl px-2.5 py-2"
                  style={{
                    background: "var(--glass-bg-subtle)",
                    border: "1px solid var(--glass-border-color)",
                  }}
                >
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                  <p className="font-black text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {isTeacher ? (
            <>
              <Button
                size="sm"
                variant="default"
                className="flex-1 text-xs"
                onClick={onView}
              >
                View quiz
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    glassBtnSubtleClass,
                    "h-8 w-8 shrink-0 rounded-xl px-0 text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="Quiz options"
                >
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={onReview}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Review Results
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAssign}>
                    <Users className="w-4 h-4 mr-2" />
                    Assign to Class
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : isPending ? (
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs"
              onClick={onStart}
            >
              Start Quiz
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold w-full justify-center py-2">
              <CheckCircle2 className="w-4 h-4" />
              {isClosed ? "Quiz closed" : "Completed"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
