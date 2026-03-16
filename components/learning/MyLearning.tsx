import { Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { courses } from "@/data/courses";
import { Course } from "@/types/course";
import { cn } from "@/lib/utils";

const enrolledCourses: Course[] = courses.filter(
  (course) => typeof course.progress === "number",
) as Course[];

function progressGradient(course: Course) {
  if (course.id === 1) {
    return "from-rose-500 via-orange-400 to-amber-300";
  }
  if (course.id === 2) {
    return "from-amber-500 via-orange-400 to-slate-300";
  }
  if (course.id === 3) {
    return "from-emerald-400 via-emerald-500 to-emerald-300";
  }
  return "from-sky-500 to-blue-400";
}

function LearningCourseCard({ course }: { course: Course }) {
  const progress = course.progress ?? 0;
  const earnedPts = Math.round((progress / 100) * course.pts);

  return (
    <Card className="relative flex flex-col overflow-hidden border-border/80 bg-card/95 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-sm shrink-0"
              style={{ backgroundColor: course.institutionColor }}>
              {course.institutionLogo}
            </div>
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold text-muted-foreground leading-tight">
                {course.institution}
              </p>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {course.title}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>
              +{earnedPts} / +{course.pts} PTS
            </span>
          </Badge>
        </div>

        <div className="mt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>
              {progress === 100 ? "Completed" : "In Progress"}
            </span>
            <span>{progress}% Complete</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                progressGradient(course),
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-5 pb-4 pt-0">
        <div className="flex items-center justify-between gap-3 w-full">
          <Button size="sm" className="px-4">
            Go To Course
          </Button>
          {progress === 100 && (
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Complete
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export function MyLearning() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-foreground">My Learning</h1>
          <p className="text-sm text-muted-foreground">
            My Enrolled Courses
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {enrolledCourses.map((course) => (
              <LearningCourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

