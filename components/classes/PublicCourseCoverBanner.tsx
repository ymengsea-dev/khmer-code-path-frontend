"use client";

import { BookOpen, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCourseSummary } from "@/lib/types/class-api";

export function PublicCourseCoverBanner({
  course,
  enrolledLabel,
  actionLabel,
  studentsLabel,
  isLoading,
}: {
  course: PublicCourseSummary;
  enrolledLabel: string;
  actionLabel: string;
  studentsLabel: string;
  isLoading?: boolean;
}) {
  const semesterLabel = course.semesterLabel?.trim();
  const showSemester = Boolean(semesterLabel && semesterLabel !== "—");

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] min-h-44 flex-col justify-end overflow-hidden bg-gradient-to-br",
        course.cardGradient || "from-violet-600 to-fuchsia-700",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <BookOpen className="pointer-events-none absolute right-2 top-1/2 h-24 w-24 -translate-y-1/2 rotate-12 text-white/10" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3.5">
        <span className="rounded-md bg-black/35 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
          {course.code}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
            course.enrolled
              ? "bg-emerald-500/90 text-white"
              : "bg-sky-500/90 text-white",
          )}
        >
          {course.enrolled ? enrolledLabel : "Public"}
        </span>
      </div>

      <div className="relative z-10 space-y-2.5 p-4 pt-0">
        <div className="min-w-0 space-y-1 pr-2">
          <h3 className="line-clamp-2 text-[17px] font-extrabold leading-snug text-white drop-shadow-sm">
            {course.name}
          </h3>
          {showSemester ? (
            <p className="truncate text-xs font-medium text-white/80">{semesterLabel}</p>
          ) : course.teacherName ? (
            <p className="truncate text-xs font-medium text-white/80">{course.teacherName}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
            <Users className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
            <span className="tabular-nums">{course.enrolledCount}</span>
            <span className="opacity-90">{studentsLabel.toLowerCase()}</span>
          </span>
          {course.teacherName && showSemester ? (
            <span className="inline-flex max-w-[9rem] items-center truncate rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
              {course.teacherName}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors",
            "group-hover:bg-white/30 group-disabled:opacity-70",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          ) : null}
          <span>{actionLabel}</span>
        </div>
      </div>
    </div>
  );
}
