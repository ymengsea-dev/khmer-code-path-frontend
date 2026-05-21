"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bot,
  FileText,
  MessageCircle,
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
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { lessonService } from "@/lib/services/lesson-service";
import { noteService } from "@/lib/services/note-service";
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
  const [summaryMaterialId, setSummaryMaterialId] = useState<string>("");
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [personalSummary, setPersonalSummary] = useState<string | null>(null);
  const [savingToNotebook, setSavingToNotebook] = useState(false);

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

  useEffect(() => {
    setPersonalSummary(null);
    setSummaryError(null);
    if (lesson?.materials?.length) {
      setSummaryMaterialId(String(lesson.materials[0].id));
    } else {
      setSummaryMaterialId("");
    }
  }, [lesson?.id, lesson?.materials]);

  const displaySummary = personalSummary ?? lesson?.summary ?? null;

  const handleSaveSummaryToNotebook = async () => {
    if (!lesson || !displaySummary) return;
    setSavingToNotebook(true);
    try {
      const escaped = displaySummary
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      await noteService.create({
        title: `AI Summary: ${lesson.title}`,
        bodyHtml: `<p>${escaped}</p>`,
        sourceLabel: lesson.title,
        lessonId: lesson.id,
        tags: ["AI-Generated"],
      });
      alert("Summary saved to your Digital Notebook.");
    } catch {
      alert("Could not save to notebook. Open Notebook from the sidebar and try again.");
    } finally {
      setSavingToNotebook(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!lesson) return;
    const materialId = Number(summaryMaterialId);
    if (!Number.isFinite(materialId)) {
      setSummaryError("Select a lesson file to summarize.");
      return;
    }
    setSummaryGenerating(true);
    setSummaryError(null);
    try {
      const result = await lessonAiService.generateSummaryFromLesson(
        lesson.id,
        materialId
      );
      if (result.persisted) {
        setLesson({ ...lesson, summary: result.summary });
        setPersonalSummary(null);
      } else {
        setPersonalSummary(result.summary);
      }
    } catch {
      setSummaryError(
        "Summary generation failed. Ensure Ollama is running, the file is uploaded, and you are enrolled in this class."
      );
    } finally {
      setSummaryGenerating(false);
    }
  };

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
                      <div>
                        <h3 className="text-sm font-extrabold text-foreground">
                          AI Lesson Summary
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Same on-demand RAG as quiz generation — indexes your selected file from
                          MinIO when you generate.
                        </p>
                      </div>
                      <Badge className="text-[10px] font-bold bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0">
                        {lesson.aiReady ? "Materials ready" : "Awaiting materials"}
                      </Badge>
                    </div>

                    {lesson.materials.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-4">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">
                            Source file
                          </label>
                          <select
                            value={summaryMaterialId}
                            onChange={(e) => setSummaryMaterialId(e.target.value)}
                            disabled={summaryGenerating}
                            className="flex h-9 w-full rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            {lesson.materials.map((mat) => (
                              <option key={mat.id} value={String(mat.id)}>
                                {mat.fileName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="inverse"
                          size="sm"
                          className="h-9 gap-1.5 text-xs font-bold shrink-0"
                          disabled={summaryGenerating || !summaryMaterialId}
                          onClick={() => void handleGenerateSummary()}
                        >
                          {summaryGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {summaryGenerating
                            ? "Indexing & summarizing…"
                            : displaySummary
                              ? "Regenerate summary"
                              : "Generate summary"}
                        </Button>
                      </div>
                    )}

                    {summaryError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">
                        {summaryError}
                      </p>
                    )}

                    {displaySummary ? (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {displaySummary}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {lesson.materials.length === 0
                          ? "Upload lesson materials first, then generate a summary from a file."
                          : isTeacher
                            ? "Select a file and generate a summary for the class."
                            : "Select a file and generate your study summary from the lesson material."}
                      </p>
                    )}

                    {personalSummary && !isTeacher && (
                      <p className="text-[10px] text-muted-foreground mt-3">
                        Personal summary — only visible to you until your teacher publishes one
                        for the class.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {displaySummary && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold"
                            disabled={savingToNotebook}
                            onClick={() => void handleSaveSummaryToNotebook()}
                          >
                            {savingToNotebook ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            Save to Notebook
                          </Button>
                          {!isTeacher && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs font-semibold"
                              onClick={() => {
                                void navigator.clipboard.writeText(displaySummary);
                              }}
                            >
                              Copy summary
                            </Button>
                          )}
                        </>
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

