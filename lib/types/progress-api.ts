export interface GradeBreakdownDto {
  classId: number;
  course: string;
  quizzes: string;
  midterm: string;
  finalExam: string;
  attendance: string;
  numericGrade: number | null;
  grade: string;
}

export interface ClassProgressDto {
  classId: number;
  className: string;
  classCode: string;
  numericGrade: number | null;
  letterGrade: string | null;
  attendanceRate: number;
  quizzesCompleted: number;
  completed: boolean;
}
