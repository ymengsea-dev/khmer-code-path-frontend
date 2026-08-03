"use client";

import { useEffect, useRef } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { fetchSessionFromServer } from "@/lib/auth/client-session";

function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const retrying = useRef(false);

  useEffect(() => {
    if (session?.error !== "RefreshAccessTokenError" || retrying.current) {
      return;
    }

    retrying.current = true;
    let cancelled = false;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    (async () => {
      // Give any in-flight refresh elsewhere (other tab, other request) a beat to
      // land before treating this as a real logout — a cold remount (e.g. browser
      // back navigation) can race a transient failure here against a refresh that
      // actually succeeds moments later.
      for (const delayMs of [0, 800, 2000]) {
        if (delayMs > 0) await wait(delayMs);
        if (cancelled) return;

        await update();
        const retried = await fetchSessionFromServer();
        if (cancelled) return;

        const stillBroken =
          retried?.error === "RefreshAccessTokenError" || !retried?.accessToken;
        if (!stillBroken) {
          retrying.current = false;
          return;
        }
      }

      if (!cancelled) {
        await signOut({ callbackUrl: "/login" });
      }
      retrying.current = false;
    })();

    return () => {
      cancelled = true;
      retrying.current = false;
    };
  }, [session?.error, update]);

  return <>{children}</>;
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <SessionErrorHandler>{children}</SessionErrorHandler>
    </SessionProvider>
  );
}
