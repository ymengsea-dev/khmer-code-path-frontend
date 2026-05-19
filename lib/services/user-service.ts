import { apiClient } from "../api-client";
import { classService } from "./class-service";
import type { ClassStudent } from "../types/class-api";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  studentId?: string | null;
  teacherId?: string | null;
  /** Teacher view: class names the student is enrolled in */
  enrolledClasses?: string;
}

export interface UserPage {
  items: UserSummary[];
  totalElements: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  studentId?: string;
  teacherId?: string;
}

function mapUser(item: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  studentId?: string | null;
  teacherId?: string | null;
}): UserSummary {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    isActive: item.isActive ?? true,
    studentId: item.studentId,
    teacherId: item.teacherId,
  };
}

export const userService = {
  async listUsers(params: {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  } = {}): Promise<UserPage> {
    const response = await apiClient.get<{ data: UserPage }>("/users", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 100,
        ...params,
      },
    });
    const data = response.data.data;
    return {
      ...data,
      items: (data.items ?? []).map(mapUser),
    };
  },

  async createUser(payload: CreateUserPayload) {
    const response = await apiClient.post<{ data: UserSummary }>("/users", payload);
    return mapUser(response.data.data);
  },

  async updateStatus(id: string, isActive: boolean) {
    const response = await apiClient.patch<{ data: UserSummary }>(`/users/${id}/status`, {
      isActive,
    });
    return mapUser(response.data.data);
  },

  /** Students enrolled in any of the current teacher's classes */
  async listTeacherStudents(): Promise<UserSummary[]> {
    const page = await classService.listClasses({ size: 100 });
    const byId = new Map<string, UserSummary & { classNames: Set<string> }>();

    for (const cls of page.items ?? []) {
      const roster = await classService.listClassStudents(cls.id);
      for (const student of roster) {
        const existing = byId.get(student.id);
        if (existing) {
          existing.classNames.add(cls.name);
        } else {
          byId.set(student.id, {
            id: student.id,
            name: student.name,
            email: student.email,
            role: "STUDENT",
            isActive: true,
            studentId: student.studentId ?? null,
            classNames: new Set([cls.name]),
          });
        }
      }
    }

    return Array.from(byId.values()).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
      studentId: row.studentId,
      enrolledClasses: Array.from(row.classNames).join(", "),
    }));
  },

  async importUsers(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<{
      data: { created: number; failed: number; errors?: { row: number; message: string }[] };
    }>("/users/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
