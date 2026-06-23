import axios from "axios";
import { apiClient } from "../api-client";
import type {
  CreateRegistrationDomainPayload,
  RegistrationDomain,
  RegistrationDomainConfig,
  SchoolConfig,
  SchoolDetail,
  SchoolRegistrationInfo,
  UpdateSchoolPayload,
} from "../types/school-api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export function apiOrigin(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

export function resolveApiAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildRegistrationUrl(
  registrationPath: string | undefined,
  registrationUrl?: string | null,
): string {
  if (registrationUrl) return registrationUrl;
  if (!registrationPath) return "";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return registrationPath;
  const path = registrationPath.startsWith("/") ? registrationPath : `/${registrationPath}`;
  return `${base}${path}`;
}

export const schoolService = {
  async getRegistrationInfo(slug: string): Promise<SchoolRegistrationInfo> {
    const response = await publicClient.get<{ data: SchoolRegistrationInfo }>(
      `/schools/register/${encodeURIComponent(slug)}`,
    );
    return response.data.data;
  },

  getRegistrationCoverUrl(coverUrl: string | null | undefined): string | null {
    return resolveApiAssetUrl(coverUrl);
  },

  async getMySchool(): Promise<SchoolDetail> {
    const response = await apiClient.get<{ data: SchoolDetail }>("/schools/me");
    return response.data.data;
  },

  async updateMySchool(payload: UpdateSchoolPayload): Promise<SchoolDetail> {
    const response = await apiClient.put<{ data: SchoolDetail }>("/schools/me", payload);
    return response.data.data;
  },

  async uploadCover(file: File): Promise<SchoolDetail> {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<{ data: SchoolDetail }>("/schools/me/cover", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  async removeCover(): Promise<SchoolDetail> {
    const response = await apiClient.delete<{ data: SchoolDetail }>("/schools/me/cover");
    return response.data.data;
  },

  async getSchoolConfig(): Promise<SchoolConfig> {
    const response = await apiClient.get<{ data: SchoolConfig }>("/schools/config");
    return response.data.data;
  },

  async getRegistrationDomainConfig(): Promise<RegistrationDomainConfig> {
    const response = await apiClient.get<{ data: RegistrationDomainConfig }>(
      "/schools/me/registration-domains/config",
    );
    return response.data.data;
  },

  async listRegistrationDomains(): Promise<RegistrationDomain[]> {
    const response = await apiClient.get<{ data: RegistrationDomain[] }>(
      "/schools/me/registration-domains",
    );
    return response.data.data;
  },

  async createRegistrationDomain(
    payload: CreateRegistrationDomainPayload,
  ): Promise<RegistrationDomain> {
    const response = await apiClient.post<{ data: RegistrationDomain }>(
      "/schools/me/registration-domains",
      payload,
    );
    return response.data.data;
  },

  async deleteRegistrationDomain(id: number): Promise<void> {
    await apiClient.delete(`/schools/me/registration-domains/${id}`);
  },
};
