import { API_BASE_URL } from "./constants";

export type LmsRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface ApiEnvelope<T> {
  status: { code: string; message: string; detail: string | null };
  data: T;
  common?: { apiId?: string; requestId?: string };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

export interface UserProfile {
  userId: string;
  userName: string;
  email: string;
  role: LmsRole;
  isActive: boolean;
}

export interface AuthData extends AuthTokens {
  user: UserProfile;
}

export async function backendLogin(
  email: string,
  password: string
): Promise<AuthData> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });

  const body = (await res.json()) as ApiEnvelope<AuthData>;

  if (!res.ok) {
    const detail =
      body?.status?.detail ?? body?.status?.message ?? "Login failed";
    throw new Error(detail);
  }

  if (!body.data?.accessToken || !body.data?.refreshToken) {
    throw new Error("Invalid login response from server");
  }

  return body.data;
}

export async function backendRefresh(
  refreshToken: string
): Promise<AuthTokens & { user?: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `ailms_refresh_token=${encodeURIComponent(refreshToken)}`,
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const body = (await res.json()) as ApiEnvelope<
    AuthTokens & { user?: UserProfile }
  >;

  if (!res.ok) {
    const detail =
      body?.status?.detail ?? body?.status?.message ?? "Refresh failed";
    throw new Error(detail);
  }

  if (!body.data?.accessToken) {
    throw new Error("Invalid refresh response from server");
  }

  return body.data;
}

export async function backendMe(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const body = (await res.json()) as ApiEnvelope<UserProfile>;

  if (!res.ok) {
    throw new Error(body?.status?.message ?? "Failed to load profile");
  }

  return body.data;
}

export async function backendLogout(refreshToken: string | undefined) {
  if (!refreshToken) return;

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Cookie: `ailms_refresh_token=${refreshToken}` },
    cache: "no-store",
  }).catch(() => {
    /* best-effort */
  });
}
