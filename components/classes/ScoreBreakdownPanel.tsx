import type { GradingWeightKey, GradingWeightsDto, ScoreComponentDto } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";

const SCORE_COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
};

export function scoreComponentBg(color: string): string {
  return SCORE_COLOR_BG[color] ?? "bg-zinc-400";
}

export function gradingWeightValue(
  weights: GradingWeightsDto,
  key: GradingWeightKey,
): number {
  return weights[key] ?? 0;
}

export function gradingWeightsTotal(weights: GradingWeightsDto): number {
  return (
    weights.attendance +
    weights.assignment +
    weights.quiz +
    weights.midterm +
    weights.finalExam
  );
}

interface ScoreBreakdownPanelProps {
  scoreComponents: ScoreComponentDto[];
  weights: GradingWeightsDto;
  editable?: boolean;
  onWeightChange?: (key: GradingWeightKey, value: number) => void;
  className?: string;
}

export function ScoreBreakdownPanel({
  scoreComponents,
  weights,
  editable = false,
  onWeightChange,
  className,
}: ScoreBreakdownPanelProps) {
  const total = gradingWeightsTotal(weights);

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Score Breakdown
      </p>

      <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-px">
        {scoreComponents.map(({ key, color }) => {
          const pct = gradingWeightValue(weights, key);
          if (pct <= 0) return null;
          return (
            <div
              key={key}
              className={cn("h-full transition-all", scoreComponentBg(color))}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      <div className="space-y-2.5">
        {scoreComponents.map(({ key, label, color }) => {
          const pct = gradingWeightValue(weights, key);
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className={cn("w-2.5 h-2.5 rounded-sm shrink-0", scoreComponentBg(color))}
              />
              <span className="flex-1 text-xs text-foreground font-medium">{label}</span>
              {editable ? (
                <div className="flex items-center gap-2 min-w-[96px]">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next)) {
                        onWeightChange?.(key, Math.max(0, Math.min(100, next)));
                      }
                    }}
                    className="glass-input w-14 h-8 px-2 text-xs text-right tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-[80px]">
                  <div className="flex-1 h-1.5 rounded-full bg-black/6 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", scoreComponentBg(color))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "flex justify-between items-center pt-1 border-t border-black/5 text-xs font-bold",
          total === 100 ? "text-foreground" : "text-rose-600",
        )}
      >
        <span>Total</span>
        <span className="tabular-nums">{total}%</span>
      </div>
    </div>
  );
}
