export type GradeLetter = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C";

export interface CourseBreakdownRow {
  id: string;
  course: string;
  quizzes: string;
  midterm: string;
  final: string;
  attendance: string;
  grade: GradeLetter;
}

export const courseBreakdownRows: CourseBreakdownRow[] = [
  {
    id: "1",
    course: "Data Structures & Algorithms",
    quizzes: "92%",
    midterm: "88%",
    final: "-",
    attendance: "100%",
    grade: "A",
  },
  {
    id: "2",
    course: "Database Management",
    quizzes: "85%",
    midterm: "90%",
    final: "-",
    attendance: "95%",
    grade: "A-",
  },
  {
    id: "3",
    course: "AI Foundation",
    quizzes: "78%",
    midterm: "-",
    final: "-",
    attendance: "98%",
    grade: "B+",
  },
];
