"use client";

import { Card } from "@/components/ui/card";
import { FACULTIES_UI } from "@/lib/lms-ui/faculties";
import type { FacultySummaryDto } from "@/lib/types/faculty-api";
import { cn } from "@/lib/utils";
import { FacultyCoverBanner } from "./FacultyCoverBanner";

export function FacultyCard({
  faculty,
  config = FACULTIES_UI,
  gradient,
  onOpen,
}: {
  faculty: FacultySummaryDto;
  config?: typeof FACULTIES_UI;
  gradient: string;
  onOpen: () => void;
}) {
  const deptLabel = config.departmentCountLabel;

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
        "group relative overflow-hidden rounded-2xl border-0 cursor-pointer transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <FacultyCoverBanner
        facultyId={faculty.id}
        coverUrl={faculty.coverUrl}
        gradient={gradient}
        variant="card"
        name={faculty.name}
        tagline={faculty.tagline}
        departmentCount={faculty.departmentCount}
        departmentLabel={deptLabel}
      />
    </Card>
  );
}
