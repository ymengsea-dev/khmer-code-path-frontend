import type { Session } from "next-auth";
import { getSession } from "next-auth/react";

const REFRESH_BUFFER_MS = 60_000;

export type ClientSession = Session & {
  accessToken?: string;
  accessTokenExpires?: number;
  error?: "RefreshAccessTokenError";
};

let inflightSessionFetch: Promise<ClientSession | null> | null = null;

/** One session fetch at a time so parallel API calls share a single token refresh. */
export function fetchSessionFromServer(): Promise<ClientSession | null> {
  if (inflightSessionFetch) {
    return inflightSessionFetch;
  }

  inflightSessionFetch = (async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return null;
      return (await res.json()) as ClientSession | null;
    } catch {
      return null;
    }
  })().finally(() => {
    inflightSessionFetch = null;
  });

  return inflightSessionFetch;
}

function isSessionTokenFresh(session: ClientSession | null | undefined): boolean {
  if (!session?.accessToken || session.error) return false;
  if (!session.accessTokenExpires) return false;
  return Date.now() < session.accessTokenExpires - REFRESH_BUFFER_MS;
}

/**
 * Returns a valid bearer token, refreshing the NextAuth session when needed.
 * Never returns an expired access token.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cached = (await getSession()) as ClientSession | null;
  if (isSessionTokenFresh(cached)) {
    return cached!.accessToken!;
  }

  const refreshed = await fetchSessionFromServer();
  if (isSessionTokenFresh(refreshed)) {
    return refreshed!.accessToken!;
  }

  return null;
}
