"use client";

import { BookOpen, Building2, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/departments";

const ACCENT_GRADIENT: Record<Department["accent"], string> = {
  violet: "from-violet-600 to-purple-700",
  blue: "from-blue-600 to-sky-700",
  emerald: "from-emerald-600 to-teal-700",
  amber: "from-amber-500 to-orange-600",
};

export function DepartmentCoverBanner({
  dept,
  teachersLabel,
  classesLabel,
  onTeachers,
}: {
  dept: Department;
  teachersLabel: string;
  classesLabel: string;
  onTeachers: () => void;
}) {
  const isActive = dept.status === "active";

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] min-h-44 flex-col justify-end overflow-hidden bg-gradient-to-br",
        ACCENT_GRADIENT[dept.accent],
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <Building2 className="pointer-events-none absolute right-2 top-1/2 h-24 w-24 -translate-y-1/2 rotate-12 text-white/10" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3.5">
        <span className="rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
          Department
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
            isActive
              ? "bg-emerald-500/90 text-white"
              : "bg-white/15 text-white/90 ring-1 ring-white/25",
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="relative z-10 space-y-2.5 p-4 pt-0">
        <div className="min-w-0 space-y-1 pr-6">
          <h3 className="line-clamp-2 text-[17px] font-extrabold leading-snug text-white drop-shadow-sm">
            {dept.name}
          </h3>
          {dept.facultyName ? (
            <p className="truncate text-xs font-medium text-white/80">{dept.facultyName}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTeachers();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <Users className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
            <span className="tabular-nums">{dept.teacherCount}</span>
            <span className="opacity-90">{teachersLabel.toLowerCase()}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
            <BookOpen className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
            <span className="tabular-nums">{dept.classCount}</span>
            <span className="opacity-90">{classesLabel.toLowerCase()}</span>
          </span>
          <ChevronRight
            className="ml-auto h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
