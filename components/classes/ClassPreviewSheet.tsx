"use client";

import {
  ArrowRight,
  UserPlus,
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
import type { ClassSummary, GradingWeightsDto } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";

const WEIGHT_ITEMS = [
  { key: "attendance" as const, label: "Attendance", color: "bg-emerald-400" },
  { key: "assignment" as const, label: "Assignment", color: "bg-blue-400" },
  { key: "quiz"       as const, label: "Quiz",       color: "bg-violet-400" },
  { key: "midterm"   as const, label: "Mid-term",   color: "bg-amber-400"  },
  { key: "finalExam" as const, label: "Final",      color: "bg-rose-400"   },
];

interface ClassPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSummary: ClassSummary | null;
  description: string;
  semesterLabel: string;
  statusLabel: string;
  canViewRoster: boolean;
  isStudent: boolean;
  gradingWeights?: GradingWeightsDto | null;
  onEnterClass: () => void;
  onManageRoster: () => void;
}

export function ClassPreviewSheet({
  open,
  onOpenChange,
  classSummary,
  description,
  semesterLabel,
  statusLabel,
  canViewRoster,
  gradingWeights,
  onEnterClass,
  onManageRoster,
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
          {/* Class meta */}
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

          {/* Grading weight breakdown */}
          {gradingWeights ? (
            <div className="space-y-3 border-t border-black/5 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Score Breakdown
              </p>

              {/* Stacked bar */}
              <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-px">
                {WEIGHT_ITEMS.map(({ key, color }) => (
                  <div
                    key={key}
                    className={cn("h-full transition-all", color)}
                    style={{ width: `${gradingWeights[key]}%` }}
                  />
                ))}
              </div>

              {/* Legend rows */}
              <div className="space-y-2.5">
                {WEIGHT_ITEMS.map(({ key, label, color }) => {
                  const pct = gradingWeights[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", color)} />
                      <span className="flex-1 text-xs text-foreground font-medium">{label}</span>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        {/* mini progress bar */}
                        <div className="flex-1 h-1.5 rounded-full bg-black/6 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-1 border-t border-black/5 text-xs font-bold text-foreground">
                <span>Total</span>
                <span>
                  {WEIGHT_ITEMS.reduce((s, { key }) => s + gradingWeights[key], 0)}%
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-black/5 px-6 py-4 space-y-2">
          <Button className="w-full font-bold gap-2" onClick={onEnterClass}>
            Enter class
            <ArrowRight className="h-4 w-4" />
          </Button>
          {canViewRoster ? (
            <Button variant="outline" className="w-full gap-2" onClick={onManageRoster}>
              <UserPlus className="h-4 w-4" />
              Class roster
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
