export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "FAILED";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  /** Included for teachers; null/undefined for students until after submission */
  correctIndex?: number | null;
  explanation?: string | null;
}

export interface QuizDto {
  id: number;
  title: string;
  description: string | null;
  classId: number;
  className: string;
  questionCount: number;
  durationMinutes: number | null;
  status: QuizStatus;
  createdAt: string;
  dueAt: string | null;
  questions?: QuizQuestion[];
  submissionStatus?: AttemptStatus | null;
  /** Only present for teachers fetching a single quiz — used to republish to another class */
  generatedContent?: string | null;
}

export interface QuizAttemptResult {
  quizId: number;
  score: number | null;
  totalQuestions: number;
  status: AttemptStatus;
  failReason: string | null;
  submittedAt: string;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  classId: number;
  generatedContent: string;
  questionCount: number;
  durationMinutes?: number;
}
