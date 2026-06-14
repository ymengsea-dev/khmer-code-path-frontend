import axios, { type InternalAxiosRequestConfig } from "axios";
import { signOut } from "next-auth/react";
import {
  fetchSessionFromServer,
  getValidAccessToken,
  type ClientSession,
} from "@/lib/auth/client-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshRetryResult =
  | { token: string; backendUnavailable?: false }
  | { token: null; backendUnavailable: boolean };

let isRefreshing = false;
let refreshWaiters: Array<{
  resolve: (result: RefreshRetryResult) => void;
  reject: (reason: unknown) => void;
}> = [];

function settleRefreshWaiters(
  error: unknown | null,
  result: RefreshRetryResult | null
) {
  refreshWaiters.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(result ?? { token: null, backendUnavailable: false });
  });
  refreshWaiters = [];
}

function isFreshSession(session: ClientSession | null): session is ClientSession & {
  accessToken: string;
} {
  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    return false;
  }
  if (!session.accessTokenExpires) return false;
  return Date.now() < session.accessTokenExpires - 60_000;
}

async function refreshAccessTokenForRetry(): Promise<RefreshRetryResult> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshWaiters.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const session = await fetchSessionFromServer();
    const token = isFreshSession(session) ? session.accessToken : null;
    const result: RefreshRetryResult = token
      ? { token }
      : {
          token: null,
          backendUnavailable: session?.error === "BackendUnavailable",
        };
    settleRefreshWaiters(null, result);
    return result;
  } catch (error) {
    settleRefreshWaiters(error, null);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResult = await refreshAccessTokenForRetry();

        if (refreshResult.token) {
          originalRequest.headers.Authorization =
            `Bearer ${refreshResult.token}`;
          return apiClient(originalRequest);
        }

        if (refreshResult.backendUnavailable) {
          return Promise.reject(error);
        }
      } catch {
        /* fall through to sign-out */
      }

      await signOut({ callbackUrl: "/login" });
    }

    return Promise.reject(error);
  }
);
