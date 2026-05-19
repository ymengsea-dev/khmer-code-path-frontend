import type { Level } from "@/types/course";

export interface CourseTechnologyDto {
  name: string;
  color: string;
}

export interface CourseSummaryDto {
  id: number;
  title: string;
  institution: string;
  institutionLogo: string | null;
  institutionColor: string;
  level: Level;
  pts: number;
  bgColor: string;
  imageUrl: string | null;
  description: string | null;
  technologies: CourseTechnologyDto[];
  prerequisite: string | null;
  achievement: string | null;
  locked: boolean;
  published: boolean;
  progress: number | null;
}

export interface CoursePageDto {
  items: CourseSummaryDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CreateCoursePayload {
  title: string;
  institution: string;
  institutionLogo?: string;
  institutionColor?: string;
  level: Level;
  pts?: number;
  bgColor?: string;
  imageUrl?: string;
  description?: string;
  technologies?: CourseTechnologyDto[];
  prerequisite?: string;
  achievement?: string;
  locked?: boolean;
  published?: boolean;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;
