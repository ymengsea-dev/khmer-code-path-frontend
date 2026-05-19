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

    (async () => {
      await update();
      const retried = await fetchSessionFromServer();
      if (cancelled) return;

      const stillBroken =
        retried?.error === "RefreshAccessTokenError" || !retried?.accessToken;

      if (stillBroken) {
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
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      <SessionErrorHandler>{children}</SessionErrorHandler>
    </SessionProvider>
  );
}
