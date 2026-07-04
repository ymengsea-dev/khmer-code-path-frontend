"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { examService } from "@/lib/services/exam-service";
import type {
  ExamAttemptResult,
  ExamDto,
  ExamQuestionDto,
} from "@/lib/types/assignments-exams-api";
import { formatQuizDueAt } from "@/lib/quiz-display";
import { TaskContentDisplayCompact } from "./TaskContentDisplay";

type ExamStage = "confirm" | "taking" | "result" | "failed";

interface ExamTakingViewProps {
  exam: ExamDto;
  onExit: () => void;
}

function parseGeneratedQuestions(content: string): ExamQuestionDto[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Record<string, unknown>>)
      .filter((q) => q.question && Array.isArray(q.options))
      .map((q, i) => ({
        id: i + 1,
        question: String(q.question),
        options: (q.options as unknown[]).map(String),
      }));
  } catch {
    return [];
  }
}

export function ExamTakingView({ exam, onExit }: ExamTakingViewProps) {
  const [stage, setStage] = useState<ExamStage>("confirm");
  const [questions, setQuestions] = useState<ExamQuestionDto[]>([]);
  const [loadingExam, setLoadingExam] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamAttemptResult | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    exam.durationMinutes ? exam.durationMinutes * 60 : null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const triggerFail = useCallback(
    async (reason: string) => {
      if (violationRef.current || stage !== "taking") return;
      violationRef.current = true;
      clearInterval(timerRef.current ?? undefined);
      setFailReason(reason);
      setStage("failed");
      try {
        await examService.fail(exam.id, reason);
      } catch {
        /* best-effort */
      }
    },
    [exam.id, stage],
  );

  useEffect(() => {
    if (stage !== "taking") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void triggerFail("You left the exam page. This violates exam rules.");
      }
    };
    const handleBlur = () => {
      void triggerFail("Browser window lost focus during the exam.");
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      void triggerFail("You tried to leave the exam page.");
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [stage, triggerFail]);

  const handleSubmit = useCallback(async () => {
    clearInterval(timerRef.current ?? undefined);
    setSubmitting(true);
    try {
      const res = await examService.submit(exam.id, answersRef.current);
      setResult(res);
      setStage("result");
    } catch {
      setFailReason("Could not submit your answers. Please check your connection and try again.");
      setStage("failed");
    } finally {
      setSubmitting(false);
    }
  }, [exam.id]);

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
  }, [stage, timeLeft, triggerFail]);

  const startExam = async () => {
    setLoadingExam(true);
    try {
      const detail = await examService.get(exam.id);
      const loaded =
        detail.questions && detail.questions.length > 0
          ? detail.questions
          : parseGeneratedQuestions(detail.generatedContent ?? "");
      if (loaded.length === 0) {
        setFailReason("Exam questions could not be loaded. Contact your teacher.");
        setStage("failed");
        return;
      }
      setQuestions(loaded);
      setCurrentIdx(0);
      setAnswers({});
      violationRef.current = false;
      if (detail.durationMinutes) {
        setTimeLeft(detail.durationMinutes * 60);
      }
      setStage("taking");
    } catch {
      setFailReason("Could not load exam. Please try again.");
      setStage("failed");
    } finally {
      setLoadingExam(false);
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

  if (stage === "confirm") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950/50 mb-2">
              <GraduationCap className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{exam.className}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-3 text-center">
              <p className="text-2xl font-black text-foreground">{exam.questionCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-3 text-center">
              <p className="text-2xl font-black text-foreground">
                {exam.durationMinutes ? `${exam.durationMinutes}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exam.durationMinutes ? "Minutes" : "No time limit"}
              </p>
            </div>
          </div>

          {formatQuizDueAt(exam.dueAt) ? (
            <p className="text-xs text-center text-muted-foreground">
              Due {formatQuizDueAt(exam.dueAt)}
            </p>
          ) : null}

          <TaskContentDisplayCompact
            blocks={exam.contentBlocks}
            examId={exam.id}
          />

          <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30 p-4 space-y-2">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Exam Rules — Read Carefully
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>You <strong>cannot switch browser tabs</strong> during the exam.</li>
              <li>You <strong>cannot leave the browser window</strong> or minimize it.</li>
              <li>Any tab switch, window blur, or page leave will <strong>automatically fail</strong> your attempt.</li>
              <li>Submit before time runs out — time expiry also fails the exam.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onExit}>
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold"
              disabled={loadingExam}
              onClick={() => void startExam()}
            >
              {loadingExam ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <GraduationCap className="w-4 h-4 mr-1.5" />
              )}
              Start Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "failed") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-300/60 dark:border-rose-800/40 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50">
            <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Exam Failed</h1>
          <div className="rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 px-5 py-4">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 justify-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Violation Detected
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
              {failReason ?? "Exam rules were violated."}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your attempt has been automatically submitted as failed. Contact your teacher if you believe this was an error.
          </p>
          <Button className="w-full font-bold" onClick={onExit}>
            Back to Assignments &amp; Exams
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    const pct =
      result?.scorePercent != null
        ? Math.round(Number(result.scorePercent))
        : result?.score != null && result.totalQuestions > 0
          ? Math.round((result.score / result.totalQuestions) * 100)
          : null;
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-emerald-300/60 dark:border-emerald-800/40 bg-white dark:bg-zinc-900/60 shadow-md p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Exam Submitted!</h1>
          {pct !== null && (
            <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-5 py-4 space-y-1">
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{pct}%</p>
              <p className="text-xs text-muted-foreground">
                {result?.score != null && result.totalQuestions > 0
                  ? `${result.score} / ${result.totalQuestions} correct`
                  : "Exam completed"}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Applied toward the Final portion of your class score breakdown.
              </p>
            </div>
          )}
          {pct === null && (
            <p className="text-sm text-muted-foreground">
              Your answers have been submitted. Your teacher will review your results.
            </p>
          )}
          <Button className="w-full font-bold" onClick={onExit}>
            Back to Assignments &amp; Exams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fffef8] dark:bg-[#1c1c1e]">
      <header className="shrink-0 px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-4 bg-white dark:bg-zinc-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <GraduationCap className="w-5 h-5 text-violet-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-foreground truncate">{exam.title}</p>
            <p className="text-[10px] text-muted-foreground">{exam.className}</p>
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
                timeLeft <= 60 ? "text-rose-600 dark:text-rose-400" : "text-foreground",
              )}
            >
              <Clock className="w-4 h-4 shrink-0" />
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </header>

      <div className="shrink-0 h-1 bg-slate-100 dark:bg-zinc-800">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

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
                const optKey = String.fromCharCode(65 + optIdx);
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
                        : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-violet-300 dark:hover:border-violet-700",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shrink-0 mt-0.5",
                        selected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-slate-300 dark:border-zinc-700 text-muted-foreground",
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
          <Button size="sm" onClick={() => setCurrentIdx((i) => i + 1)} className="gap-1.5">
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
            Submit Exam
          </Button>
        )}
      </div>
    </div>
  );
}
