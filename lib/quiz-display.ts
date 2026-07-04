import type { QuizDto, QuizKind } from "@/lib/types/quiz-api";
import { QUIZZES_UI } from "@/lib/lms-ui/quizzes";

export function isQuizPastDue(quiz: Pick<QuizDto, "dueAt" | "pastDue">): boolean {
  if (quiz.pastDue) return true;
  if (!quiz.dueAt) return false;
  return new Date(quiz.dueAt).getTime() < Date.now();
}

export function isQuizAttemptDone(
  quiz: Pick<QuizDto, "submissionStatus">,
): boolean {
  return (
    quiz.submissionStatus === "SUBMITTED" || quiz.submissionStatus === "FAILED"
  );
}

export function canStudentStartQuiz(quiz: QuizDto): boolean {
  return (
    quiz.status === "PUBLISHED" &&
    !isQuizAttemptDone(quiz) &&
    !isQuizPastDue(quiz)
  );
}

export function formatQuizDueAt(dueAt: string | null | undefined): string | null {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function quizKindLabel(
  kind: QuizKind | null | undefined,
): string {
  const value = kind ?? "ASSIGNMENT";
  const found = QUIZZES_UI.kinds.find((item) => item.value === value);
  return found?.label ?? (value === "EXAM" ? "Exam" : "Assignment");
}
