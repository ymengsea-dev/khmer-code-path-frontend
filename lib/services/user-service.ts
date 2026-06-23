import { apiClient } from "../api-client";
import { classService } from "./class-service";
import type { ClassStudent } from "../types/class-api";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  avatarUrl?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  /** Teacher view: class names the student is enrolled in */
  enrolledClasses?: string;
  enrolledClassIds?: string[];
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  studentId?: string | null;
  isActive?: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
  enrolledClasses?: string;
  enrolledClassIds?: string[];
  memberSince?: string;
}

export interface UserPage {
  items: UserSummary[];
  totalElements: number;
}

export interface UserManagementTabConfig {
  id: string;
  label: string;
}

export interface StatusFilterConfig {
  value: string;
  label: string;
}

export interface ClassFilterConfig {
  value: string;
  label: string;
}

export interface UserManagementConfig {
  pageTitle: string;
  pageDescription: string;
  tabs: UserManagementTabConfig[];
  statusFilters: StatusFilterConfig[];
  classFilters: ClassFilterConfig[];
  cardGradients: string[];
  actions: {
    canAdd: boolean;
    canImport: boolean;
    canEditStatus: boolean;
  };
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
  role?: string;
  isActive?: boolean;
  avatarUrl?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  enrolledClasses?: string;
  enrolledClassIds?: string[];
}): UserSummary {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role ?? "STUDENT",
    isActive: item.isActive ?? true,
    avatarUrl: item.avatarUrl,
    studentId: item.studentId,
    teacherId: item.teacherId,
    enrolledClasses: item.enrolledClasses,
    enrolledClassIds: item.enrolledClassIds,
  };
}

export const userService = {
  async getManagementConfig(): Promise<UserManagementConfig> {
    const response = await apiClient.get<{ data: UserManagementConfig }>(
      "/student-management/config",
    );
    return response.data.data;
  },

  async listStudents(params: {
    classId?: string;
    search?: string;
    isActive?: boolean;
  } = {}): Promise<UserPage> {
    const response = await apiClient.get<{ data: UserPage }>(
      "/student-management/students",
      {
        params: {
          classId:
            params.classId && params.classId !== "all"
              ? params.classId
              : undefined,
          search: params.search?.trim() || undefined,
          isActive: params.isActive,
        },
      },
    );
    const data = response.data.data;
    return {
      ...data,
      items: (data.items ?? []).map(mapUser),
    };
  },

  async getStudent(id: string): Promise<StudentDetail> {
    const response = await apiClient.get<{ data: StudentDetail }>(
      `/student-management/students/${id}`,
    );
    return response.data.data;
  },

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

  async updateRole(id: string, role: "STUDENT" | "TEACHER" | "ADMIN") {
    const response = await apiClient.put<{ data: UserSummary }>(`/users/${id}`, { role });
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
            avatarUrl: student.avatarUrl,
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
      avatarUrl: row.avatarUrl,
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
