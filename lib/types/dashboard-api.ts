export interface StudentDashboard {
  overallGpa: number | null;
  coursesCompleted: number;
  coursesEnrolled: number;
  quizzesCompleted: number;
  attendanceRate: number;
}

export interface ClassComment {
  id: number;
  classId: number;
  className: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface TeacherDashboard {
  activeClasses: number;
  quizzes: number;
  students: number;
  studentQuestions: number;
  recentQuestions: ClassComment[];
}

export interface AdminDashboard {
  totalStudents: number;
  totalInstructors: number;
  totalDepartments: number;
  totalClasses: number;
}
