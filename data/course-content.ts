export type LessonTemplateIcon = "slides" | "video";

export interface LessonTemplate {
  id: string;
  title: string;
  module: string;
  assetCount: number;
  quizCount: number;
  description: string;
  icon: LessonTemplateIcon;
  gradient: string;
}

export const COURSE_CONTENT_MODULES = [
  "All Modules",
  "Algorithms",
  "Fundamentals",
  "Data Structures",
  "System Design",
] as const;

export const initialLessonTemplates: LessonTemplate[] = [
  {
    id: "tpl-search",
    title: "Search Algorithms Master",
    module: "Algorithms",
    assetCount: 8,
    quizCount: 3,
    description:
      "A comprehensive lesson pack covering Binary, Linear, and Interpolation search.",
    icon: "slides",
    gradient: "from-slate-800 to-slate-600",
  },
  {
    id: "tpl-bigo",
    title: "Big O Notation Basics",
    module: "Fundamentals",
    assetCount: 4,
    quizCount: 1,
    description:
      "Introduction to time and space complexity with AI-generated examples.",
    icon: "video",
    gradient: "from-indigo-800 to-indigo-600",
  },
];
