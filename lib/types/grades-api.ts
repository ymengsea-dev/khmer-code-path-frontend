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

export interface FinalGradeDto {
  classId: number;
  studentId: string;
  numericGrade: number;
  letterGrade: string;
}
