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
  enrolledStudents?: number | null;
  submittedCount?: number | null;
  failedCount?: number | null;
}

export interface QuizAttemptResult {
  quizId: number;
  score: number | null;
  totalQuestions: number;
  status: AttemptStatus;
  failReason: string | null;
  submittedAt: string;
}

export interface QuizSubmissionReview {
  submissionId: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttemptStatus;
  score: number | null;
  totalQuestions: number;
  scorePercent: number | null;
  failReason: string | null;
  answers: Record<number, number>;
  wrongAnswers: QuizWrongAnswer[];
  submittedAt: string;
}

export interface QuizWrongAnswer {
  questionId: number;
  question: string;
  selectedIndex: number | null;
  selectedAnswer: string | null;
  correctIndex: number;
  correctAnswer: string | null;
  explanation: string | null;
}

export interface QuizResults {
  quiz: QuizDto;
  enrolledStudents: number;
  submittedCount: number;
  failedCount: number;
  notStartedCount: number;
  averageScorePercent: number;
  highestScore: number;
  lowestScore: number;
  submissions: QuizSubmissionReview[];
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  classId: number;
  generatedContent: string;
  questionCount: number;
  durationMinutes?: number;
}

export interface UpdateQuizPayload {
  title: string;
  description?: string | null;
  generatedContent: string;
  questionCount: number;
  durationMinutes?: number | null;
}
