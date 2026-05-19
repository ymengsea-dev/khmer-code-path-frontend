import React from "react";
import { Lock, Star, Video, User, Clock, ChevronRight } from "lucide-react";
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
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="gap-1 font-bold bg-black/60 hover:bg-black/80 text-white border-0 text-[10px] py-0.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          +{course.pts} PTS
        </Badge>
      </div>

      <div className="absolute bottom-2 left-2">
        <InstitutionBadge
          name={course.institution}
          color={course.institutionColor}
        />
      </div>

      {course.locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
          <Lock className="w-6 h-6 text-white/80" />
        </div>
      )}
    </div>
  );
}

export function CourseCard({ course, selected, onClick }: CourseCardProps) {
  // Dynamically map instructors, time information, and current lesson details
  const getInstructor = (id: number) => {
    if (id === 1) return "Dr. SOK";
    if (id === 2) return "Dr. SOK";
    if (id === 3) return "Prof. MENGSEA";
    return "Dr. SOK";
  };

  const getCurrentLesson = (title: string) => {
    if (title.toLowerCase().includes("python")) {
      return "Current Lesson: Binary Search Trees & AVL Trees";
    }
    if (title.toLowerCase().includes("web")) {
      return "Current Lesson: React Hooks & SSR Frameworks";
    }
    if (title.toLowerCase().includes("ai") || title.toLowerCase().includes("engineer")) {
      return "Current Lesson: LLM Orchestration & Prompting";
    }
    return "Current Lesson: Intro to Variables & Syntaxes";
  };

  const getTimeAgo = (id: number) => {
    return id % 2 === 0 ? "1d ago" : "2h ago";
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col h-full",
        selected && "border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-lg"
      )}
    >
      <CardThumbnail course={course} />
      
      <CardContent className="flex flex-col gap-2 p-4 flex-1">
        {/* Title */}
        <h3 className="font-extrabold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-indigo-500 transition-colors">
          {course.title}
        </h3>

        {/* Level and Meta details */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-indigo-500/80" />
            {getInstructor(course.id)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-500/80" />
            {getTimeAgo(course.id)}
          </span>
        </div>

        {/* Current Lesson Detail text */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
          {getCurrentLesson(course.title)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex items-center gap-2">
        {/* Resume/Start Button */}
        <Button
          variant={course.locked ? "secondary" : "default"}
          size="sm"
          className="flex-1 text-xs font-bold h-9 active:translate-y-px transition-all"
          disabled={course.locked}
        >
          {course.locked ? "Locked" : "Resume Lesson"}
        </Button>

        {/* Dynamic Video Class Join Button */}
        {!course.locked && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-600 active:translate-y-px transition-all"
            title="Join Online Class"
            onClick={(e) => {
              e.stopPropagation();
              window.open("http://localhost:3000/virtual-class.html", "_blank");
            }}
          >
            <Video className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
