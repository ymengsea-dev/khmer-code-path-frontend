"use client";

import { Card } from "@/components/ui/card";
import type { FacultyConfigDto, FacultySummaryDto } from "@/lib/types/faculty-api";
import { cn } from "@/lib/utils";
import { FacultyCoverBanner } from "./FacultyCoverBanner";

export function FacultyCard({
  faculty,
  config,
  gradient,
  onOpen,
}: {
  faculty: FacultySummaryDto;
  config: FacultyConfigDto | null;
  gradient: string;
  onOpen: () => void;
}) {
  const deptLabel = config?.departmentCountLabel ?? "Departments";

  return (
    <Card
      bouncy={false}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl p-0 gap-0",
        "border-0 bg-transparent shadow-none backdrop-blur-none",
        "ring-1 ring-slate-200/90 dark:ring-zinc-800/90",
        "transition-all duration-300 outline-none",
        "hover:shadow-lg hover:ring-violet-400/40 dark:hover:ring-violet-500/30",
        "focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      <FacultyCoverBanner
        facultyId={faculty.id}
        coverUrl={faculty.coverUrl}
        gradient={gradient}
        name={faculty.name}
        tagline={faculty.tagline}
        status={faculty.status}
        departmentCount={faculty.departmentCount}
        departmentLabel={deptLabel}
        variant="card"
      />
    </Card>
  );
}
