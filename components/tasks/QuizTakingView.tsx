"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { quizService } from "@/lib/services/quiz-service";
import type { QuizAttemptResult, QuizDto, QuizQuestion } from "@/lib/types/quiz-api";

/* ─── Question parser ─────────────────────────────────────────────────── */

function parseQuestions(content: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return (parsed as Array<Record<string, unknown>>)
        .filter((q) => q.question && Array.isArray(q.options))
        .map((q, i) => ({
          id: i + 1,
          question: String(q.question),
          options: (q.options as unknown[]).map(String),
        }));
    }
  } catch {
    /* fallback: treat as opaque content */
  }
  return [];
}

/* ─── Types ───────────────────────────────────────────────────────────── */

type QuizStage = "confirm" | "taking" | "result" | "failed";

interface QuizTakingViewProps {
  quiz: QuizDto;
  onExit: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────── */

export function QuizTakingView({ quiz, onExit }: QuizTakingViewProps) {
  const [stage, setStage] = useState<QuizStage>("confirm");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.durationMinutes ? quiz.durationMinutes * 60 : null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationRef = useRef(false);

  /* ── Auto-fail: tab switch / window blur ── */
  const triggerFail = useCallback(
    async (reason: string) => {
      if (violationRef.current || stage !== "taking") return;
      violationRef.current = true;
      clearInterval(timerRef.current ?? undefined);
      setFailReason(reason);
      setStage("failed");
      try {
        await quizService.fail(quiz.id, reason);
      } catch {
        /* best-effort */
      }
    },
    [quiz.id, stage]
  );

  useEffect(() => {
    if (stage !== "taking") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void triggerFail("You left the quiz tab. This violates quiz rules.");
      }
    };
    const handleBlur = () => {
      void triggerFail("Browser window lost focus during the quiz.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [stage, triggerFail]);

  /* ── Timer countdown ── */
  useEffect(() => {
    if (stage !== "taking" || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current ?? undefined);
          void triggerFail("Time ran out.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current ?? undefined);
  }, [stage]); // intentionally only re-run when stage changes

  /* ── Load questions when entering quiz ── */
  const startQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const detail = await quizService.getQuiz(quiz.id);
      const parsed =
        (detail.questions && detail.questions.length > 0)
          ? detail.questions
          : parseQuestions(detail.description ?? "");
      if (parsed.length === 0) {
        // Fallback: quiz has no structured questions; show error
        setFailReason("Quiz questions could not be loaded. Contact your teacher.");
        setStage("failed");
        return;
      }
      setQuestions(parsed);
      setCurrentIdx(0);
      setAnswers({});
      violationRef.current = false;
      setStage("taking");
    } catch {
      setFailReason("Could not load quiz. Please try again.");
      setStage("failed");
    } finally {
      setLoadingQuiz(false);
    }
  };

  /* ── Submit answers ── */
  const handleSubmit = async () => {
    clearInterval(timerRef.current ?? undefined);
    setSubmitting(true);
    try {
      const res = await quizService.submit(quiz.id, answers);
      setResult(res);
      setStage("result");
    } catch {
      setResult({
        quizId: quiz.id,
        score: null,
        totalQuestions: questions.length,
        status: "SUBMITTED",
        failReason: null,
        submittedAt: new Date().toISOString(),
      });
      setStage("result");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  /* ══════════════════════════════════════════════════════════════
     STAGE: confirm
  ══════════════════════════════════════════════════════════════ */
  if (stage === "confirm") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="max-w-lg w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950/50 mb-2">
              <ShieldAlert className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">{quiz.className}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-3 text-center">
              <p className="text-2xl font-black text-foreground">{quiz.questionCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-3 text-center">
              <p className="text-2xl font-black text-foreground">
                {quiz.durationMinutes ? `${quiz.durationMinutes}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {quiz.durationMinutes ? "Minutes" : "No time limit"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30 p-4 space-y-2">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Quiz Rules — Read Carefully
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>You <strong>cannot switch browser tabs</strong> during the quiz.</li>
              <li>You <strong>cannot leave the browser window</strong> or minimize it.</li>
              <li>Any tab switch or window blur will <strong>automatically fail</strong> your attempt.</li>
              <li>Submit before time runs out.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onExit}>
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold bg-violet-600 hover:bg-violet-700 text-white"
              disabled={loadingQuiz}
              onClick={() => void startQuiz()}
            >
              {loadingQuiz ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-1.5" />
              )}
              I Understand — Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     STAGE: failed
  ══════════════════════════════════════════════════════════════ */
  if (stage === "failed") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-2xl border border-rose-300/60 dark:border-rose-800/40 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50">
            <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Quiz Failed</h1>
          <div className="rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 px-5 py-4">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 justify-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Violation Detected
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
              {failReason ?? "Quiz rules were violated."}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your attempt has been automatically submitted as failed. Contact your teacher if you believe this was an error.
          </p>
          <Button className="w-full font-bold" onClick={onExit}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     STAGE: result
  ══════════════════════════════════════════════════════════════ */
  if (stage === "result") {
    const pct =
      result?.score != null && result.totalQuestions > 0
        ? Math.round((result.score / result.totalQuestions) * 100)
        : null;
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-2xl border border-emerald-300/60 dark:border-emerald-800/40 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Quiz Submitted!</h1>
          {pct !== null && (
            <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-5 py-4">
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {pct}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {result?.score} / {result?.totalQuestions} correct
              </p>
            </div>
          )}
          {pct === null && (
            <p className="text-sm text-muted-foreground">
              Your answers have been submitted. Your teacher will review your results.
            </p>
          )}
          <Button className="w-full font-bold" onClick={onExit}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     STAGE: taking
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fffef8] dark:bg-[#1c1c1e]">
      {/* Quiz header bar */}
      <header className="shrink-0 px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-4 bg-white dark:bg-zinc-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-foreground truncate">{quiz.title}</p>
            <p className="text-[10px] text-muted-foreground">{quiz.className}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className="bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-0 text-xs font-bold">
            {currentIdx + 1} / {questions.length}
          </Badge>
          {timeLeft !== null && (
            <span
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold tabular-nums",
                timeLeft <= 60 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              )}
            >
              <Clock className="w-4 h-4 shrink-0" />
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="shrink-0 h-1 bg-slate-100 dark:bg-zinc-800">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-8 max-w-3xl mx-auto w-full">
        {currentQuestion && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] text-violet-500 font-bold uppercase tracking-wider mb-2">
                Question {currentIdx + 1}
              </p>
              <h2 className="text-lg font-semibold text-foreground leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const optKey = String.fromCharCode(65 + optIdx); // A, B, C, D
                const selected = answers[currentQuestion.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }))
                    }
                    className={cn(
                      "w-full text-left rounded-xl border px-5 py-4 flex items-start gap-4 transition-all duration-150",
                      selected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-sm"
                        : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-violet-300 dark:hover:border-violet-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shrink-0 mt-0.5",
                        selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-slate-300 dark:border-zinc-700 text-muted-foreground"
                      )}
                    >
                      {optKey}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="shrink-0 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <p className="text-xs text-muted-foreground">
          {answeredCount} / {questions.length} answered
        </p>

        {currentIdx < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!allAnswered || submitting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
