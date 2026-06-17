"use client";

import { BouncyEnter } from "./BouncyEnter";
import { cn } from "@/lib/utils";

type BouncyPageProps = {
  children: React.ReactNode;
  className?: string;
};

/** Full-page mount wrapper — use with a stable `key` when switching routes/views. */
export function BouncyPage({ children, className }: BouncyPageProps) {
  return (
    <BouncyEnter variant="enter" className={cn("flex-1 min-h-0 flex flex-col", className)}>
      {children}
    </BouncyEnter>
  );
}
