import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Level } from "@/types/course";

const levelConfig: Record<Level, { label: string; className: string }> = {
  BEGINNER: {
    label: "BEGINNER",
    className: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  INTERMEDIATE: {
    label: "INTERMEDIATE",
    className: "bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  ADVANCED: {
    label: "ADVANCED",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface LevelBadgeProps {
  level: Level;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const cfg = levelConfig[level];
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-bold tracking-widest border", cfg.className)}
    >
      {cfg.label}
    </Badge>
  );
}
