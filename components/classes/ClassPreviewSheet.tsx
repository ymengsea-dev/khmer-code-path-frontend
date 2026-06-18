"use client";

import {
  ArrowRight,
  Users,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClassSummary, GradingWeightsDto, ScoreComponentDto } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";
import { ScoreBreakdownPanel } from "@/components/classes/ScoreBreakdownPanel";

interface ClassPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSummary: ClassSummary | null;
  description: string;
  semesterLabel: string;
  statusLabel: string;
  gradingWeights: GradingWeightsDto | null;
  scoreComponents: ScoreComponentDto[];
  onEnterClass: () => void;
}

export function ClassPreviewSheet({
  open,
  onOpenChange,
  classSummary,
  description,
  semesterLabel,
  statusLabel,
  gradingWeights,
  scoreComponents,
  onEnterClass,
}: ClassPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm flex flex-col gap-0 p-0 overflow-hidden border-l-0"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(32px) saturate(1.8)",
          WebkitBackdropFilter: "blur(32px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        }}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-black/5 shrink-0 text-left">
          <SheetTitle className="text-lg font-extrabold pr-8">
            {classSummary?.name ?? "Class"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {classSummary?.code} · {semesterLabel}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px] font-bold">
              {classSummary?.code}
            </Badge>
            <Badge
              className={cn(
                "text-[10px] font-bold border-0",
                statusLabel === "Active"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>{classSummary?.teacherName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{classSummary?.enrolledCount} students enrolled</span>
            </div>
            <p className="text-xs">{semesterLabel}</p>
          </div>

          {description ? (
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-black/5 pt-4">
              {description}
            </p>
          ) : null}

          {gradingWeights && scoreComponents.length > 0 ? (
            <div className="border-t border-black/5 pt-5">
              <ScoreBreakdownPanel
                scoreComponents={scoreComponents}
                weights={gradingWeights}
              />
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-black/5 px-6 py-4">
          <Button className="w-full font-bold gap-2" onClick={onEnterClass}>
            Enter class
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
