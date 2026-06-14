"use client";

import { BookOpen, CheckCircle2, ClipboardList, Loader2, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { profileSummaryService } from "@/lib/services/profile-summary-service";
import type { LearningClassDto } from "@/lib/types/profile-summary-api";

interface MyLearningProps {
  onEnterClass?: (payload: { classId: string; title: string; module: string }) => void;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function progressValue(item: LearningClassDto): number {
  if (item.progress?.completed) return 100;
  if (typeof item.progress?.numericGrade === "number") return clamp(item.progress.numericGrade);
  if (typeof item.progress?.attendanceRate === "number") return clamp(item.progress.attendanceRate);
  return 0;
}

function LearningCourseCard({
  item,
  onEnterClass,
}: {
  item: LearningClassDto;
  onEnterClass?: MyLearningProps["onEnterClass"];
}) {
  const progress = progressValue(item);
  const completed = item.progress?.completed || progress >= 100;
  const earnedPts = Math.round(progress);
  const klass = item.summary;

  return (
    <Card className="relative flex flex-col overflow-hidden border-border/80 bg-card/95 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm shrink-0 bg-linear-to-br",
                klass.cardGradient
              )}
            >
              {klass.code.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[13px] font-semibold text-muted-foreground leading-tight truncate">
                {klass.teacherName}
              </p>
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {klass.name}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{earnedPts} pts</span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-muted-foreground">Grade</p>
            <p className="font-bold text-foreground">
              {item.progress?.letterGrade ?? item.progress?.numericGrade ?? "Pending"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-muted-foreground">Quizzes</p>
            <p className="font-bold text-foreground">
              {item.progress?.quizzesCompleted ?? 0} done
              {item.pendingQuizzes > 0 ? ` · ${item.pendingQuizzes} pending` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>{completed ? "Completed" : "In Progress"}</span>
            <span>{progress}% Complete</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-linear-to-r", klass.cardGradient)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-5 pb-4 pt-0">
        <div className="flex items-center justify-between gap-3 w-full">
          <Button
            size="sm"
            className="px-4"
            onClick={() =>
              onEnterClass?.({
                classId: String(klass.id),
                title: klass.name,
                module: klass.semesterLabel ?? "",
              })
            }
          >
            Continue Learning
          </Button>
          {completed ? (
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Complete
            </span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

export function MyLearning({ onEnterClass }: MyLearningProps) {
  const { data: currentUser } = useCurrentUser();
  const studentId = currentUser?.userId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-learning", studentId],
    enabled: Boolean(studentId),
    queryFn: () => profileSummaryService.getMyLearning(),
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-foreground">My Learning</h1>
          <p className="text-sm text-muted-foreground">
            Your enrolled classes, progress, and pending quizzes.
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pt-5 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Could not load your learning data.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/80">
                  <CardContent className="p-4 flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                      <p className="text-xl font-black">{data?.dashboard.coursesEnrolled ?? 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/80">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-xl font-black">{data?.dashboard.coursesCompleted ?? 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/80">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Quizzes Done</p>
                      <p className="text-xl font-black">{data?.dashboard.quizzesCompleted ?? 0}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {data?.learningClasses.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                  {data.learningClasses.map((item) => (
                    <LearningCourseCard
                      key={item.summary.id}
                      item={item}
                      onEnterClass={onEnterClass}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    You are not enrolled in any classes yet.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
