import type { ClassSummary } from "./class-api";
import type { StudentDashboard, TeacherDashboard, AdminDashboard } from "./dashboard-api";
import type { NoteListDto } from "./note-api";
import type { ClassProgressDto, GradeBreakdownDto } from "./progress-api";
import type { QuizDto } from "./quiz-api";

export interface LearningClassDto {
  summary: ClassSummary;
  progress: ClassProgressDto;
  pendingQuizzes: number;
}

export interface MyLearningDto {
  dashboard: StudentDashboard;
  learningClasses: LearningClassDto[];
}

export interface ProfileSummaryDto {
  role: "STUDENT" | "TEACHER" | "ADMIN";
  studentDashboard: StudentDashboard | null;
  teacherDashboard: TeacherDashboard | null;
  adminDashboard: AdminDashboard | null;
  notes: NoteListDto;
  classes: ClassSummary[];
  quizzes: QuizDto[];
  gradeRows: GradeBreakdownDto[];
}
