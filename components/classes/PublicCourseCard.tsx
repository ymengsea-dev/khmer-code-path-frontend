"use client";

import { Card } from "@/components/ui/card";
import type { PublicCourseSummary } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";
import { PublicCourseCoverBanner } from "./PublicCourseCoverBanner";

export function PublicCourseCard({
  course,
  enrolledLabel,
  enrollLabel,
  openLabel,
  studentsLabel,
  isLoading,
  onAction,
}: {
  course: PublicCourseSummary;
  enrolledLabel: string;
  enrollLabel: string;
  openLabel: string;
  studentsLabel: string;
  isLoading?: boolean;
  onAction: () => void;
}) {
  const actionLabel = course.enrolled ? openLabel : enrollLabel;

  return (
    <Card
      bouncy={false}
      role="button"
      tabIndex={0}
      aria-busy={isLoading || undefined}
      onClick={() => {
        if (!isLoading) onAction();
      }}
      onKeyDown={(e) => {
        if (isLoading) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAction();
        }
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl p-0 gap-0",
        "border-0 bg-transparent shadow-none backdrop-blur-none",
        "ring-1 ring-slate-200/90 dark:ring-zinc-800/90",
        "transition-all duration-300 outline-none",
        "hover:shadow-lg hover:ring-violet-400/40 dark:hover:ring-violet-500/30",
        "focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-80",
      )}
    >
      <PublicCourseCoverBanner
        course={course}
        enrolledLabel={enrolledLabel}
        actionLabel={actionLabel}
        studentsLabel={studentsLabel}
        isLoading={isLoading}
      />
    </Card>
  );
}
