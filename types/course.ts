export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Technology {
  name: string;
  color: string;
}

export interface Course {
  id: number;
  title: string;
  institution: string;
  institutionLogo: string;
  institutionColor: string;
  level: Level;
  pts: number;
  bgColor: string;
  /** Optional cover image URL for the course card */
  image?: string;
  description: string;
  technologies: Technology[];
  prerequisite?: string;
  achievement: string;
  locked?: boolean;
  /** Optional completion percentage for learning view */
  progress?: number;
}
