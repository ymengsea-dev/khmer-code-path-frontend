export interface GradeDto {
  id: number;
  classId: number;
  className: string;
  studentId: string;
  studentName: string;
  numericGrade: number;
  letterGrade: string;
  createdAt: string;
}

export interface GradebookRowDto {
  studentId: string;
  studentName: string;
  gradeId: number | null;
  numericGrade: number | null;
  letterGrade: string | null;
}

export interface GradebookDto {
  classId: number;
  className: string;
  rows: GradebookRowDto[];
}

export interface FinalGradeDto {
  classId: number;
  studentId: string;
  numericGrade: number;
  letterGrade: string;
}
