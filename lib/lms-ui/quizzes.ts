export const QUIZZES_UI = {
  navLabel: "Quizzes",
  pageTitle: "Quizzes",
  kinds: [
    {
      value: "ASSIGNMENT" as const,
      label: "Assignment",
      description: "Practice or homework — submit before the deadline.",
    },
    {
      value: "EXAM" as const,
      label: "Exam",
      description: "Proctored — leaving the page or switching tabs fails the attempt.",
    },
  ],
  examProctoringHint:
    "Stay on this page for the entire exam. Switching tabs or leaving the window will fail your attempt.",
  assignmentHint:
    "Complete and submit before the deadline. You may leave and return until you submit.",
} as const;
