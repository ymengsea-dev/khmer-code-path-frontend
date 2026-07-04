export interface TaskContentUploadResponse {
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export type TaskContentBlockKind =
  | "AI_QUESTIONS"
  | "FILE"
  | "LIBRARY_SOURCE";

export interface TaskContentBlockInput {
  kind: TaskContentBlockKind;
  orderIndex?: number;
  generatedContent?: string;
  questionCount?: number;
  sourceLabel?: string;
  storageKey?: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  sourceKind?: "lesson" | "library" | "library-content";
  lessonId?: number;
  libraryItemId?: number;
  materialId?: number;
  label?: string;
}

export interface TaskContentBlockDto {
  kind: TaskContentBlockKind;
  orderIndex: number;
  label?: string | null;
  generatedContent?: string | null;
  questionCount?: number | null;
  sourceLabel?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  downloadUrl?: string | null;
  sourceKind?: string | null;
  lessonId?: number | null;
  libraryItemId?: number | null;
  materialId?: number | null;
  htmlContent?: string | null;
}

export interface AssignmentDto {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  classId: number;
  className: string;
  status: string;
  createdAt: string;
  dueAt: string | null;
  pastDue: boolean;
  submissionStatus?: string | null;
  submittedContent?: string | null;
  submissionScorePercent?: number | null;
  enrolledStudents?: number | null;
  submittedCount?: number | null;
  contentBlocks?: TaskContentBlockDto[] | null;
}

export interface AssignmentSubmissionDto {
  submissionId: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  content: string;
  status: string;
  submittedAt: string;
  feedback: string | null;
  grade: number | null;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  instructions?: string;
  classId: number;
  dueAt?: string | null;
  contentBlocks?: TaskContentBlockInput[];
}

export interface SubmitAssignmentPayload {
  content: string;
}

export interface ExamQuestionDto {
  id: number;
  question: string;
  options: string[];
  correctIndex?: number | null;
  explanation?: string | null;
}

export interface ExamDto {
  id: number;
  title: string;
  description: string | null;
  classId: number;
  className: string;
  questionCount: number;
  durationMinutes: number | null;
  status: string;
  createdAt: string;
  dueAt: string | null;
  pastDue: boolean;
  questions?: ExamQuestionDto[];
  submissionStatus?: string | null;
  generatedContent?: string | null;
  enrolledStudents?: number | null;
  submittedCount?: number | null;
  failedCount?: number | null;
  contentBlocks?: TaskContentBlockDto[] | null;
}

export interface ExamAttemptResult {
  examId: number;
  score: number | null;
  totalQuestions: number;
  scorePercent?: number | null;
  status: string;
  failReason: string | null;
  submittedAt: string;
}

export interface CreateExamPayload {
  title: string;
  description?: string;
  classId: number;
  dueAt?: string | null;
  durationMinutes?: number;
  generatedContent?: string;
  questionCount?: number;
  contentBlocks?: TaskContentBlockInput[];
}

export interface ExamResults {
  exam: ExamDto;
  enrolledStudents: number;
  submittedCount: number;
  failedCount: number;
  notStartedCount: number;
  averageScorePercent: number;
  submissions: Array<{
    submissionId: number;
    studentName: string;
    studentEmail: string;
    status: string;
    score: number | null;
    totalQuestions: number;
    scorePercent: number | null;
    failReason: string | null;
    submittedAt: string;
  }>;
}
