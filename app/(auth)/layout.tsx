"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthLayoutSwitcher } from "@/components/auth/AuthLayoutSwitcher";
import { SchoolRegisterLayout } from "@/components/auth/SchoolRegisterLayout";

function extractRegisterSlug(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/register\/([^/]+)$/);
  return match?.[1] ?? null;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = extractRegisterSlug(pathname);

  if (slug) {
    return <SchoolRegisterLayout slug={slug}>{children}</SchoolRegisterLayout>;
  }

  return <AuthLayoutSwitcher>{children}</AuthLayoutSwitcher>;
}
