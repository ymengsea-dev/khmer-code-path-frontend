"use client";

import { Card } from "@/components/ui/card";
import type { ClassSummary } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";
import { ClassCoverBanner } from "./ClassCoverBanner";

export function ClassCard({
  summary,
  semesterLabel,
  gradient,
  studentsLabel,
  onOpen,
}: {
  summary: ClassSummary;
  semesterLabel: string;
  gradient: string;
  studentsLabel: string;
  onOpen: () => void;
}) {
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
      <ClassCoverBanner
        summary={summary}
        semesterLabel={semesterLabel}
        gradient={gradient}
        studentsLabel={studentsLabel}
      />
    </Card>
  );
}
