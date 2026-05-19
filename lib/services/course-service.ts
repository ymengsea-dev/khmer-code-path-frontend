import { apiClient } from "../api-client";
import type { Course, Technology } from "@/types/course";
import type {
  CoursePageDto,
  CourseSummaryDto,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "../types/course-api";

export function mapCourseDto(dto: CourseSummaryDto): Course {
  return {
    id: dto.id,
    title: dto.title,
    institution: dto.institution,
    institutionLogo: dto.institutionLogo ?? dto.institution.slice(0, 1).toUpperCase(),
    institutionColor: dto.institutionColor,
    level: dto.level,
    pts: dto.pts,
    bgColor: dto.bgColor,
    image: dto.imageUrl ?? undefined,
    description: dto.description ?? "",
    technologies: (dto.technologies ?? []).map(
      (t): Technology => ({ name: t.name, color: t.color })
    ),
    prerequisite: dto.prerequisite ?? undefined,
    achievement: dto.achievement ?? "",
    locked: dto.locked,
    progress: dto.progress ?? undefined,
  };
}

export const courseService = {
  async listCourses(params: {
    search?: string;
    level?: string;
    page?: number;
    size?: number;
  } = {}): Promise<Course[]> {
    const response = await apiClient.get<{ data: CoursePageDto }>("/courses", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 100,
        ...params,
      },
    });
    const items = response.data.data?.items ?? [];
    return items.map(mapCourseDto);
  },

  async getCourse(id: number): Promise<Course> {
    const response = await apiClient.get<{ data: CourseSummaryDto }>(
      `/courses/${id}`
    );
    return mapCourseDto(response.data.data);
  },

  async createCourse(payload: CreateCoursePayload): Promise<Course> {
    const response = await apiClient.post<{ data: CourseSummaryDto }>(
      "/courses",
      payload
    );
    return mapCourseDto(response.data.data);
  },

  async updateCourse(id: number, payload: UpdateCoursePayload): Promise<Course> {
    const response = await apiClient.put<{ data: CourseSummaryDto }>(
      `/courses/${id}`,
      payload
    );
    return mapCourseDto(response.data.data);
  },

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },
};
