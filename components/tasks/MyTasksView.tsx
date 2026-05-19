"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  Sparkles,
  Zap,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/services/auth-service";
import { useQueryState } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";

type UserRole = "student" | "teacher" | "admin";

interface QuizItem {
  id: number;
  title: string;
  description: string;
  status: "pending" | "completed";
  statusLabel: string;
  meta: string;
  completedOn?: string;
}

const quizzes: QuizItem[] = [
  {
    id: 1,
    title: "Quiz 5: Binary Search Efficiency",
    description: "Based on Lesson 5 materials. 10 Questions, 20 Minutes.",
    status: "pending",
    statusLabel: "Pending",
    meta: "Due: Tomorrow",
  },
  {
    id: 2,
    title: "Quiz 4: Big O Fundamentals",
    description: "Completed on May 8, 2026.",
    status: "completed",
    statusLabel: "Completed",
    meta: "Score: 90/100",
    completedOn: "May 8, 2026",
  },
];

const lessonOptions = [
  "Lesson 5: Search Algorithms",
  "Lesson 4: Big O Notation",
];

export function MyTasksView() {
  const [role, setRole] = useState<UserRole>("student");
  const [lessonSource, setLessonSource] = useQueryState(
    QueryKey.lessonSource,
    lessonOptions[0]
  );
  const [questionCount, setQuestionCount] = useQueryState(QueryKey.questions, "10");

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await authService.me();
        if (response?.data?.role) {
          setRole(response.data.role.toLowerCase() as UserRole);
        }
      } catch {
        /* default student */
      }
    }
    fetchUserRole();
  }, []);

  const isTeacher = role === "teacher" || role === "admin";

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quizzes
            <FlaskConical className="w-5 h-5 text-violet-500" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assess your knowledge with AI-powered quizzes.
          </p>
        </div>
        {isTeacher && (
          <Button
            size="sm"
            variant="inverse"
            className="gap-1.5 font-bold h-8.5 text-xs active:translate-y-px transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Quiz
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {isTeacher && (
          <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                Quick AI Quiz Generator
              </h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-[2] space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Select Lesson Source
                </Label>
                <select
                  value={lessonSource}
                  onChange={(e) => setLessonSource(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {lessonOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Questions
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button variant="inverse" className="gap-1.5 font-bold h-9 shrink-0">
                <Zap className="w-4 h-4" />
                Generate Quiz
              </Button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <Badge
                    className={cn(
                      "text-[10px] font-bold border-0",
                      quiz.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                    )}
                  >
                    {quiz.statusLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    {quiz.status === "pending" && (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {quiz.meta}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-[13px] text-muted-foreground mb-4">
                  {quiz.description}
                </p>

                {quiz.status === "pending" && !isTeacher && (
                  <Button variant="inverse" className="w-full font-bold h-9">
                    Start Quiz
                  </Button>
                )}

                {quiz.status === "pending" && isTeacher && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 font-bold h-9">
                      Edit
                    </Button>
                    <Button variant="outline" className="flex-1 font-bold h-9">
                      View Results
                    </Button>
                  </div>
                )}

                {quiz.status === "completed" && (
                  <Button variant="outline" className="w-full font-bold h-9">
                    Review Answers
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
