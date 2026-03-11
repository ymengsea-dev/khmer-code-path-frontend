import { Badge } from "@/components/ui/badge";

interface TechChipProps {
  name: string;
  color: string;
}

export function TechChip({ name, color }: TechChipProps) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  );
}
