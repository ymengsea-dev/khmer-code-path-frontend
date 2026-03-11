import { Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Course } from "@/types/course";
import { LevelBadge } from "./LevelBadge";
import { InstitutionBadge } from "./InstitutionBadge";

interface CourseCardProps {
  course: Course;
  selected: boolean;
  onClick: () => void;
}

function CardThumbnail({ course }: { course: Course }) {
  return (
    <div className={cn("relative h-36 bg-gradient-to-br overflow-hidden", course.bgColor)}>
      {/* Course cover image (when provided) */}
      {course.image && (
        <>
          <img
            src={course.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </>
      )}
      {/* Decorative code overlay */}
      <div className="absolute inset-0 opacity-20 font-mono text-[8px] text-white leading-3 p-2 overflow-hidden select-none pointer-events-none">
        {course.level === "BEGINNER" &&
          `def hello_world():\n    print("Hello!")\n\nfor i in range(10):\n    hello_world()\n\nclass Node:\n    def __init__(self):\n        self.val = 0`}
        {course.level === "INTERMEDIATE" &&
          `import torch\nimport torch.nn as nn\n\nclass Model(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Linear(128,10)`}
        {course.level === "ADVANCED" &&
          `async function deploy() {\n  const k8s = new K8sClient();\n  await k8s.apply(manifest);\n  console.log("Deployed!");\n}`}
      </div>

      <div className="absolute bottom-2 left-2">
        <InstitutionBadge
          name={course.institution}
          color={course.institutionColor}
        />
      </div>

      {course.locked && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-white/60" />
        </div>
      )}
    </div>
  );
}

export function CourseCard({ course, selected, onClick }: CourseCardProps) {
  return (
    <Card
      size="sm"
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-200 overflow-hidden",
        selected
          ? "border-primary ring-2 ring-primary/40 shadow-lg"
          : "hover:shadow-md",
      )}
    >
      <CardThumbnail course={course} />
      <CardContent className="flex flex-col gap-2 p-4 pt-0 flex-1">
        <p className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2">
          {course.title}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <LevelBadge level={course.level} />
          <Badge variant="secondary" className="gap-1 font-medium shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
            +{course.pts} PTS
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={course.locked}
        >
          {course.locked ? "Locked" : "Start Course"}
        </Button>
      </CardFooter>
    </Card>
  );
}
