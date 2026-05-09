import { X, Lock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Course } from "@/types/course";
import { TechChip } from "./TechChip";

const institutionFullName: Record<string, string> = {
  MIT: "Massachusetts Inst. of Technology",
  Stanford: "Stanford University",
  Meta: "Meta",
};

interface CourseDetailPanelProps {
  course: Course;
  onClose: () => void;
}

function InstitutionHeader({ course }: { course: Course }) {
  return (
    <Card className="mb-4 bg-white/50 dark:bg-card/50 backdrop-blur-sm border-0">
      <CardContent className="flex items-center gap-2 p-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0"
          style={{ backgroundColor: course.institutionColor }}
        >
          {course.institutionLogo}
        </div>
        <span className="text-sm font-semibold text-card-foreground">
          {institutionFullName[course.institution] ?? course.institution}
        </span>
      </CardContent>
    </Card>
  );
}

function PrerequisiteNotice({ prerequisite }: { prerequisite: string }) {
  return (
    <Card className="mb-4 border-0 bg-amber-500/15 dark:bg-amber-500/10 backdrop-blur-sm">
      <CardContent className="flex items-start gap-2 p-3">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-foreground">
          Requires achievement in{" "}
          <span className="font-semibold">"{prerequisite}"</span>.
        </p>
      </CardContent>
    </Card>
  );
}

function AchievementSection({ course }: { course: Course }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="bg-white/50 dark:bg-card/50 backdrop-blur-sm border-0">
        <CardHeader className="p-3 pb-0">
          <CardDescription className="text-xs font-bold uppercase tracking-wider">
            Achievement Gained
          </CardDescription>
          <p className="text-xs text-muted-foreground italic">
            "{course.achievement}"
          </p>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Award className="w-7 h-7 text-primary-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/50 dark:bg-card/50 backdrop-blur-sm border-0">
        <CardHeader className="p-3 pb-0">
          <CardDescription className="text-xs font-bold uppercase tracking-wider">
            Certificate Preview
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-2 text-center">
          <div
            className="w-full h-2 rounded mb-1.5"
            style={{ backgroundColor: course.institutionColor }}
          />
          <p
            className="text-[9px] font-bold"
            style={{ color: course.institutionColor }}
          >
            {institutionFullName[course.institution] ?? course.institution}
          </p>
          <p className="text-[8px] text-muted-foreground mt-1">
            Certificate of Completion
          </p>
          <p className="text-[9px] font-semibold text-card-foreground mt-0.5">
            {course.title.split(" ").slice(0, 3).join(" ")}
          </p>
          <div className="w-6 h-6 rounded-full bg-muted mx-auto mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function CourseDetailPanel({ course, onClose }: CourseDetailPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white/75 dark:bg-card/80 backdrop-blur-2xl backdrop-saturate-200 text-card-foreground rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-3 border-b border-transparent">
        <div className="max-w-[80%]">
          <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
          <CardDescription className="mt-0.5">
            {course.level.charAt(0) + course.level.slice(1).toLowerCase()} Level
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 rounded-full"
          aria-label="Close panel"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1 px-5">
        <div className="py-4">
          <InstitutionHeader course={course} />

          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Technologies Learned
            </p>
            <div className="flex flex-wrap gap-2">
              {course.technologies.map((t) => (
                <TechChip key={t.name} name={t.name} color={t.color} />
              ))}
            </div>
          </div>

          {course.prerequisite && (
            <PrerequisiteNotice prerequisite={course.prerequisite} />
          )}

          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Course Level
            </p>
            <Badge variant="default" className="font-bold tracking-wider">
              {course.level} LEVEL
            </Badge>
          </div>

          <Separator className="my-4 bg-transparent" />

          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </p>
            <p className="text-sm text-card-foreground leading-relaxed">
              {course.description}
            </p>
          </div>

          <Separator className="my-4 bg-transparent" />

          <AchievementSection course={course} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-transparent">
        <Button className="w-full" size="lg">
          Start This Course
        </Button>
      </div>
    </div>
  );
}
