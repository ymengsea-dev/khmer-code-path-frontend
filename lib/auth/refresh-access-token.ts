import type { JWT } from "next-auth/jwt";
import { backendRefresh, type LmsRole } from "./backend-api";

const REFRESH_BUFFER_MS = 60_000;

function mapRole(role: LmsRole) {
  return role.toLowerCase() as "student" | "teacher" | "admin";
}

function isAccessTokenFresh(token: JWT): boolean {
  if (!token.accessToken) return false;
  if (!token.accessTokenExpires) return false;
  return Date.now() < (token.accessTokenExpires as number) - REFRESH_BUFFER_MS;
}

/** Single in-flight refresh per server process — avoids NextAuth JWT callback races. */
let refreshPromise: Promise<JWT> | null = null;

async function performRefresh(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const data = await backendRefresh(token.refreshToken as string);
    const expiresInMs = (data.expiresIn ?? 3600) * 1000;

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + expiresInMs,
      error: undefined,
      ...(data.user
        ? {
            role: mapRole(data.user.role),
            name: data.user.userName,
            email: data.user.email,
          }
        : {}),
    };
  } catch (error) {
    console.error("[auth] refreshAccessToken failed:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/** Re-fetch access token using the refresh token stored in the encrypted session JWT. */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (isAccessTokenFresh(token)) {
    return token;
  }

  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh(token).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
