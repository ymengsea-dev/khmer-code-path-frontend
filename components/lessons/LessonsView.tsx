"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bot,
  FileText,
  MessageCircle,
  Redo2,
  Save,
  Send,
  Sparkles,
  Video,
  Loader2,
  Upload,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/services/auth-service";
import { lessonService } from "@/lib/services/lesson-service";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";
import { getValidAccessToken } from "@/lib/auth/client-session";

type UserRole = "student" | "teacher" | "admin";
type LessonTab = "overview" | "materials" | "attendance";

const LESSON_TABS: LessonTab[] = ["overview", "materials", "attendance"];

function parseLessonTab(value: string | null): LessonTab {
  if (value && LESSON_TABS.includes(value as LessonTab)) {
    return value as LessonTab;
  }
  return "overview";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LessonsViewProps {
  classId?: string | null;
  lessonIdParam?: string | null;
  classTitle?: string | null;
  classModule?: string | null;
}

export function LessonsView({
  classId,
  lessonIdParam,
  classTitle,
  classModule,
}: LessonsViewProps) {
  const { get, setParams } = useQueryParams();
  const activeTab = parseLessonTab(get(QueryKey.tab));

  const setActiveTab = (tab: LessonTab) => {
    setParams({ [QueryKey.tab]: tab === "overview" ? null : tab });
  };

  const [role, setRole] = useState<UserRole>("student");
  const [lessons, setLessons] = useState<LessonSummaryDto[]>([]);
  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const parsedClassId = classId ? Number(classId) : NaN;
  const isTeacher = role === "teacher" || role === "admin";
  const canManage = isTeacher;

  const selectLesson = useCallback(
    (id: number) => {
      setParams({ [QueryKey.lessonId]: String(id) });
    },
    [setParams]
  );

  const loadLessonDetail = useCallback(async (lessonId: number) => {
    try {
      const detail = await lessonService.getLesson(lessonId);
      setLesson(detail);
      setError(null);
    } catch {
      setLesson(null);
      setError("Could not load lesson. You may not be enrolled in this class.");
    }
  }, []);

  const loadLessons = useCallback(async () => {
    if (!Number.isFinite(parsedClassId)) {
      setLoading(false);
      setError("No class selected.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await lessonService.listLessons(parsedClassId);
      setLessons(list);
      const selectedId = lessonIdParam
        ? Number(lessonIdParam)
        : list[0]?.id;
      if (selectedId && list.some((l) => l.id === selectedId)) {
        await loadLessonDetail(selectedId);
      } else if (list[0]) {
        selectLesson(list[0].id);
        await loadLessonDetail(list[0].id);
      } else {
        setLesson(null);
      }
    } catch {
      setLessons([]);
      setLesson(null);
      setError(
        "Could not load lessons. If you are a student, ask your teacher to enroll you in this class."
      );
    } finally {
      setLoading(false);
    }
  }, [parsedClassId, lessonIdParam, loadLessonDetail, selectLesson]);

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
    void fetchUserRole();
  }, []);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    const id = lessonIdParam ? Number(lessonIdParam) : NaN;
    if (Number.isFinite(id) && lessons.some((l) => l.id === id)) {
      void loadLessonDetail(id);
    }
  }, [lessonIdParam, lessons, loadLessonDetail]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lesson || !e.target.files?.length) return;
    setUploading(true);
    try {
      await lessonService.uploadMaterials(lesson.id, Array.from(e.target.files));
      await loadLessonDetail(lesson.id);
    } catch {
      setError("Upload failed. Use PDF, PPTX, or DOCX under 50MB.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (materialId: number, fileName: string) => {
    if (!lesson) return;
    const token = await getValidAccessToken();
    const url = lessonService.materialDownloadUrl(lesson.id, materialId);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const displayTitle = lesson?.title ?? classTitle ?? "Class";
  const displayModule =
    lesson?.moduleTag ?? classModule ?? lesson?.className ?? "";

  const tabs: { id: LessonTab; label: string; teacherOnly?: boolean }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "materials",
      label: `Materials (${lesson?.materials?.length ?? 0})`,
    },
    { id: "attendance", label: "Attendance", teacherOnly: true },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground truncate">
            {displayTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{displayModule}</p>
          {lessons.length > 1 && (
            <div className="relative mt-2 inline-block">
              <select
                className="h-8 rounded-md border border-input bg-transparent pl-2 pr-8 text-xs font-medium appearance-none"
                value={lesson?.id ?? ""}
                onChange={(e) => selectLesson(Number(e.target.value))}
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isTeacher ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Video className="w-3.5 h-3.5" />
              Join Online Class
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Video className="w-3.5 h-3.5" />
              Start Online Class
            </Button>
          )}
          <Button size="sm" variant="inverse" className="h-8.5 gap-1.5 text-xs font-bold">
            <Bot className="w-3.5 h-3.5" />
            Generate AI Quiz
          </Button>
        </div>
      </header>

      {error && (
        <p className="px-6 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!lesson && !error && (
        <p className="px-6 py-12 text-sm text-muted-foreground text-center">
          No lessons in this class yet.
          {canManage ? " Add one from Course Content Library or create via API." : ""}
        </p>
      )}

      {lesson && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(320px,400px)] gap-8">
            <div className="space-y-8 min-w-0">
              <Card className="overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs">
                <div className="relative h-[200px] sm:h-[280px] bg-black flex flex-col items-center justify-center text-white p-6 text-center">
                  <FileText className="w-12 h-12 text-rose-500 mb-3" />
                  <p className="text-sm text-white/80">
                    {lesson.materials[0]?.fileName ??
                      "Upload materials to preview lesson content"}
                  </p>
                </div>
              </Card>

              <div className="flex gap-2 border-b border-slate-200/80 dark:border-zinc-800">
                {tabs
                  .filter((tab) => !tab.teacherOnly || isTeacher)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px",
                        activeTab === tab.id
                          ? "border-violet-500 text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">
                      About this lesson
                    </h3>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {lesson.description ??
                        "Your teacher has not added a description yet."}
                    </p>
                  </div>

                  <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 p-6 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
                      <h3 className="text-sm font-extrabold text-foreground">
                        AI Lesson Summary
                      </h3>
                      <Badge className="text-[10px] font-bold bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0">
                        {lesson.aiReady ? "Materials ready" : "Awaiting materials"}
                      </Badge>
                    </div>
                    {lesson.summary ? (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {lesson.summary}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Summary will be available when lesson materials are uploaded and
                        AI summarization is connected.
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!isTeacher && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-semibold"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save to Notebook
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-semibold"
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "materials" && (
                <Card className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs overflow-hidden">
                  {canManage && (
                    <div className="p-4 border-b border-slate-200/60 dark:border-zinc-800">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background text-xs font-semibold hover:bg-accent">
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.pptx,.docx,.ppt,.doc"
                          onChange={(e) => void handleUpload(e)}
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload materials
                      </label>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
                          <th className="px-5 py-3">File Name</th>
                          <th className="px-5 py-3">Size</th>
                          <th className="px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                        {lesson.materials.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-5 py-8 text-center text-muted-foreground"
                            >
                              No materials yet.
                            </td>
                          </tr>
                        ) : (
                          lesson.materials.map((file) => (
                            <tr
                              key={file.id}
                              className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/25"
                            >
                              <td className="px-5 py-3 font-medium text-foreground">
                                {file.fileName}
                              </td>
                              <td className="px-5 py-3 text-muted-foreground">
                                {formatBytes(file.fileSizeBytes)}
                              </td>
                              <td className="px-5 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs font-semibold"
                                  onClick={() =>
                                    void handleDownload(file.id, file.fileName)
                                  }
                                >
                                  Download
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {activeTab === "attendance" && isTeacher && (
                <Card className="border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs p-6">
                  <p className="text-sm text-muted-foreground">
                    Use class attendance from the Classes screen (session-based).
                  </p>
                </Card>
              )}
            </div>

            <aside className="space-y-6 min-w-0">
              <Card className="border border-violet-500/30 bg-white dark:bg-zinc-900/40 shadow-2xs p-5">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-violet-500 shrink-0" />
                  <h3 className="text-sm font-extrabold text-foreground">
                    Ask AI about this lesson
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {lesson.aiReady
                    ? "Lesson materials are available for AI Q&A when connected."
                    : "Upload materials to enable AI features."}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="h-9 flex-1"
                    disabled={!lesson.aiReady}
                  />
                  <Button
                    variant="inverse"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={!lesson.aiReady}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

