"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { GlassButton } from "@/components/ui/glass-button";
import { glassBtnPrimaryClass, glassInputClass } from "@/components/ui/glass-field";
import { authService } from "@/lib/services/auth-service";
import { schoolService } from "@/lib/services/school-service";
import { getApiErrorMessage } from "@/lib/api-error";
import type { SchoolRegistrationInfo } from "@/lib/types/school-api";
import { cn } from "@/lib/utils";

const inputClass = cn(
  glassInputClass,
  "w-full text-zinc-800 placeholder:text-zinc-600 dark:text-zinc-800 dark:placeholder:text-zinc-600",
);
const labelClass = "font-medium text-zinc-800";
const mutedTextClass = "text-zinc-600";
const headingClass = "text-3xl font-bold tracking-tight text-zinc-950";
const alertClass = "rounded-xl px-3 py-2.5 text-sm font-medium";
const formPanelClass =
  "school-register-form liquid-glass-btn flex flex-col gap-6 rounded-3xl p-6 sm:p-8";

function RegisterContent() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [info, setInfo] = useState<SchoolRegistrationInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    setError(null);
    schoolService
      .getRegistrationInfo(slug)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setError("This school registration link is not valid.");
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!info?.registrationOpen) {
      setError("Registration is currently closed for this school.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await authService.register({
        username,
        email,
        password,
        schoolSlug: slug,
      });
      setSuccess("Account created. You can sign in now.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Registration failed. Please check your details and try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className={cn(formPanelClass, "h-48 items-center justify-center")}>
        <Loader2 className={cn("h-8 w-8 animate-spin", mutedTextClass)} />
      </div>
    );
  }

  if (!info) {
    return (
      <div className={cn(formPanelClass, "border border-red-300 bg-red-50/95 text-red-800")}>
        {error ?? "School not found."}
      </div>
    );
  }

  return (
    <div className={formPanelClass}>
      <div className="flex flex-col gap-3 text-center lg:text-left">
        <h2 className={headingClass}>Join {info.name}</h2>
        {info.tagline ? (
          <p className={cn("text-2xl font-semibold leading-snug lg:hidden", mutedTextClass)}>
            {info.tagline}
          </p>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className={cn(alertClass, "border border-red-300 bg-red-50 text-red-800")}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div className={cn(alertClass, "border border-emerald-300 bg-emerald-50 text-emerald-800")}>{success}</div>
      ) : null}

      {!info.registrationOpen ? (
        <div className={cn(alertClass, "border border-amber-300 bg-amber-50 text-amber-900")}>
          Registration is closed for this school right now.
        </div>
      ) : null}

      {info.domainRequired && info.allowedDomains.length > 0 ? (
        <div className={cn(alertClass, "border border-indigo-200 bg-indigo-50 text-indigo-950")}>
          Use a school email ending with:{" "}
          <span className="font-semibold">{info.allowedDomains.join(", ")}</span>
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={handleRegister}>
        <div className="grid gap-2">
          <Label htmlFor="username" className={labelClass}>
            Full name
          </Label>
          <input
            id="username"
            name="username"
            required
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className={labelClass}>
            Email
          </Label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="name@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className={labelClass}>
            Password
          </Label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={4}
              maxLength={16}
              className={cn(inputClass, "pr-10")}
              placeholder="4–16 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={cn("absolute right-3 top-3", mutedTextClass, "hover:text-zinc-900")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <GlassButton
          type="submit"
          primary
          disabled={isLoading || !info.registrationOpen}
          className={cn(glassBtnPrimaryClass, "mt-2 h-11 w-full rounded-xl text-base font-semibold")}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </GlassButton>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-300/70" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={cn("bg-transparent px-2", mutedTextClass)}>Or</span>
        </div>
      </div>

      <button
        type="button"
        disabled={!info.registrationOpen}
        onClick={() => authService.googleLogin(slug)}
        className="school-register-google-btn inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold outline-none select-none disabled:pointer-events-none disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm font-medium text-zinc-800">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className={cn(formPanelClass, "h-48 items-center justify-center")}>
          <Loader2 className={cn("h-8 w-8 animate-spin", mutedTextClass)} />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
