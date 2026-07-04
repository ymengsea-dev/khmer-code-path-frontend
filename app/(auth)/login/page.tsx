"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLogoMark } from "@/components/brand/AppLogo";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { glassBtnPrimaryClass, glassBtnSubtleClass } from "@/components/ui/glass-field";
import { authService } from "@/lib/services/auth-service";

const inputClass = cn(
  "w-full h-12 rounded-2xl px-4 text-sm font-medium",
  "bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md",
  "border border-black/[0.06] dark:border-white/[0.08]",
  "text-foreground placeholder:text-muted-foreground/70",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-[#305FC9]/30 focus:border-[#305FC9]/40"
);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError).replace(/_/g, " "));
      return;
    }

    const token = searchParams.get("token");
    if (!token) return;

    const params = new URLSearchParams({ token });
    const refresh = searchParams.get("refresh");
    const expiresIn = searchParams.get("expiresIn");
    if (refresh) params.set("refresh", refresh);
    if (expiresIn) params.set("expiresIn", expiresIn);

    router.replace(`/api/auth/oauth/callback?${params.toString()}`);
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authService.login({ email, password });
      router.push("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  return (
    <div className="w-full">
      <div
        className="rounded-[1.75rem] p-8 sm:p-9"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border-color)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <AppLogoMark className="h-14 w-auto mb-5" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-[280px]">
            Sign in to continue to your classes, assignments, and learning tools.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 rounded-2xl border border-rose-300/60 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
              Email address
            </Label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#305FC9] hover:text-[#254db0] hover:underline dark:text-[#6b93e8]"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              glassBtnPrimaryClass,
              "w-full h-12 rounded-2xl text-sm font-bold gap-2 mt-1 group"
            )}
            style={{
              background: "#305FC9",
              boxShadow: "0 4px 14px rgba(48,95,201,0.35)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className={cn(
            glassBtnSubtleClass,
            "w-full h-12 rounded-2xl text-sm font-semibold gap-2.5"
          )}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New student?{" "}
          <Link
            href="/register/default"
            className="font-semibold text-[#305FC9] hover:underline dark:text-[#6b93e8]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
