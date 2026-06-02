"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, Sparkles, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { classService } from "@/lib/services/class-service";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { lessonService } from "@/lib/services/lesson-service";
import { noteService } from "@/lib/services/note-service";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { lessonTabLabel, resolveLessonTab } from "@/lib/course-content/lesson-tabs";
import type { LessonTabDto } from "@/lib/types/class-api";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";
import { getValidAccessToken } from "@/lib/auth/client-session";
import { ClassCourseContent } from "@/components/lessons/ClassCourseContent";
import { LessonAskPanel } from "@/components/lessons/LessonAskPanel";
import { ClassCommentsPanel } from "@/components/classes/ClassCommentsPanel";
import { ClassStudentsDialog } from "@/components/classes/ClassStudentsDialog";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useNotifications } from "@/components/notifications/notification-context";
import { useConfirm } from "@/components/ui/confirm-dialog";

type UserRole = "student" | "teacher" | "admin";

function cleanSummaryLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function summaryToNotebookHtml(text: string): string {
  const blocks = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of blocks) {
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    const looksLikeHeading =
      /^#{1,6}\s+/.test(line) ||
      (line.endsWith(":") && line.length <= 80 && !bullet && !numbered);

    if (looksLikeHeading) {
      closeList();
      html.push(`<h3>${escapeHtml(cleanSummaryLine(line).replace(/:$/, ""))}</h3>`);
      continue;
    }

    if (bullet || numbered) {
      const nextListType = numbered ? "ol" : "ul";
      if (listType !== nextListType) {
        closeList();
        html.push(`<${nextListType}>`);
        listType = nextListType;
      }
      html.push(`<li>${escapeHtml(cleanSummaryLine(bullet?.[1] ?? numbered?.[1] ?? line))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(cleanSummaryLine(line))}</p>`);
  }

  closeList();
  return html.join("");
}

function SummaryContent({ text }: { text: string }) {
  const blocks = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-violet-500/15 bg-white/70 dark:bg-zinc-950/40 p-4 space-y-3">
      {blocks.map((line, index) => {
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        const numbered = line.match(/^\d+[.)]\s+(.+)$/);
        const looksLikeHeading =
          /^#{1,6}\s+/.test(line) ||
          (line.endsWith(":") && line.length <= 80 && !bullet && !numbered);

        if (looksLikeHeading) {
          return (
            <h3 key={`${line}-${index}`} className="text-sm font-extrabold text-foreground">
              {cleanSummaryLine(line).replace(/:$/, "")}
            </h3>
          );
        }

        if (bullet || numbered) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              <p className="text-foreground/90">{cleanSummaryLine(bullet?.[1] ?? numbered?.[1] ?? line)}</p>
            </div>
          );
        }

        return (
          <p key={`${line}-${index}`} className="text-sm text-foreground/90 leading-relaxed">
            {cleanSummaryLine(line)}
          </p>
        );
      })}
    </div>
  );
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
  onBackToClasses?: () => void;
}

export function LessonsView({
  classId,
  lessonIdParam,
  classTitle,
  classModule,
  onBackToClasses,
}: LessonsViewProps) {
  const { get, setParams } = useQueryParams();
  const { alert: showAlert, confirm } = useConfirm();
  const [lessonTabs, setLessonTabs] = useState<LessonTabDto[]>([]);
  const defaultTabId = lessonTabs[0]?.id ?? "content";
  const activeTab = resolveLessonTab(get(QueryKey.tab), lessonTabs);

  const setActiveTab = (tab: string) => {
    setParams({ [QueryKey.tab]: tab === defaultTabId ? null : tab });
  };

  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as UserRole) ?? "student";
  const [lessons, setLessons] = useState<LessonSummaryDto[]>([]);
  const [lesson, setLesson] = useState<LessonDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summaryMaterialId, setSummaryMaterialId] = useState<string>("");
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [personalSummary, setPersonalSummary] = useState<string | null>(null);
  const [savingToNotebook, setSavingToNotebook] = useState(false);

  const [rosterOpen, setRosterOpen] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);

  const parsedClassId = classId ? Number(classId) : NaN;
  const isTeacher = role === "teacher" || role === "admin";
  const canManage = isTeacher;
  const canPostComments = role === "student" || isTeacher;

  const { notifications, markRead } = useNotifications();
  const unreadCommentNotifs = notifications.filter(
    (n) =>
      n.notificationType === "CLASS_QUESTION" &&
      n.classId === parsedClassId &&
      !n.read
  );
  const commentBadge = unreadCommentNotifs.length;

  const handleCommentsTabOpen = () => {
    if (unreadCommentNotifs.length > 0) {
      unreadCommentNotifs.forEach((n) => void markRead(n.id));
    }
    setActiveTab("comments");
  };

  const selectLesson = useCallback(
    (id: number) => {
      setParams({ [QueryKey.lessonId]: String(id) });
    },
    [setParams]
  );

  const clearLesson = useCallback(() => {
    setLesson(null);
    setParams({ [QueryKey.lessonId]: null });
  }, [setParams]);

  const loadLessonDetail = useCallback(async (lessonId: number) => {
    try {
      const detail = await lessonService.getLesson(lessonId);
      setLesson(detail);
      setError(null);
    } catch {
      setLesson(null);
      setError("Could not load this lesson.");
    }
  }, []);

  const openLesson = useCallback(
    (id: number) => {
      selectLesson(id);
      void loadLessonDetail(id);
    },
    [selectLesson, loadLessonDetail]
  );

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
      const selectedId = lessonIdParam ? Number(lessonIdParam) : NaN;
      if (Number.isFinite(selectedId) && list.some((l) => l.id === selectedId)) {
        await loadLessonDetail(selectedId);
      } else {
        setLesson(null);
      }
    } catch {
      setLessons([]);
      setLesson(null);
      setError("Could not load lessons for this class.");
    } finally {
      setLoading(false);
    }
  }, [parsedClassId, lessonIdParam, loadLessonDetail]);

  useEffect(() => {
    classService
      .getClassConfig()
      .then((config) => setLessonTabs(config.lessonTabs))
      .catch(() => setLessonTabs([]));
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
      await noteService.create({
        title: `Summary: ${lesson.title}`,
        bodyHtml: summaryToNotebookHtml(displaySummary),
        sourceLabel: lesson.title,
        lessonId: lesson.id,
        tags: ["AI-Generated"],
      });
      void showAlert("Summary saved to your Digital Notebook.", {
        title: "Saved",
        variant: "success",
      });
    } catch {
      void showAlert("Could not save to notebook.", {
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setSavingToNotebook(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!lesson) return;
    setSummaryGenerating(true);
    setSummaryError(null);
    try {
      const materialId = Number(summaryMaterialId);
      const result =
        !isTeacher || !Number.isFinite(materialId)
          ? await lessonAiService.generateSummaryFromLessonContent(lesson.id)
          : await lessonAiService.generateSummaryFromLesson(lesson.id, materialId);
      if (result.persisted) {
        setLesson({ ...lesson, summary: result.summary });
        setPersonalSummary(null);
      } else {
        setPersonalSummary(result.summary);
      }
    } catch {
      setSummaryError(
        isTeacher
          ? "Summary could not be generated. Check the lesson content or uploaded files."
          : "Summary could not be generated. This lesson may not have written notes yet."
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

  const handleDeleteClass = async () => {
    if (!Number.isFinite(parsedClassId)) return;
    const ok = await confirm(
      `"${displayTitle}" and all its lessons will be permanently deleted. This cannot be undone.`,
      { title: "Delete Class", confirmLabel: "Delete", variant: "destructive" }
    );
    if (!ok) return;
    setDeletingClass(true);
    try {
      await classService.deleteClass(parsedClassId);
      onBackToClasses?.();
    } catch {
      setError("Could not delete the class. Please try again.");
    } finally {
      setDeletingClass(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    const target = lessons.find((l) => l.id === lessonId);
    const ok = await confirm(
      `"${target?.title ?? "This lesson"}" will be permanently removed from the class.`,
      { title: "Delete Lesson", confirmLabel: "Delete", variant: "destructive" }
    );
    if (!ok) return;
    setDeletingLessonId(lessonId);
    try {
      await lessonService.deleteLesson(lessonId);
      if (lesson?.id === lessonId) clearLesson();
      await loadLessons();
    } catch {
      setError("Could not delete the lesson. Please try again.");
    } finally {
      setDeletingLessonId(null);
    }
  };

  const displayTitle = classTitle ?? lesson?.className ?? lessons[0]?.className ?? "Class";
  const displayModule = classModule ?? "";

  const visibleTabs = isTeacher
    ? lessonTabs.filter((t) => t.id !== "ai")
    : lessonTabs;

  const materialCount = lesson?.materials?.length ?? 0;
  const lessonCount = lessons.length;
  const lessonsTabLabel =
    lessonTabs.find((t) => t.id === "content")?.label ?? "Lessons";
  const needsLesson =
    activeTab !== "content" && activeTab !== "comments" && !lesson;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-clip bg-[#fffef8] dark:bg-[#1c1c1e]">
      <header className="shrink-0 px-4 sm:px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {onBackToClasses ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 mt-0.5"
              onClick={onBackToClasses}
              aria-label="Back to classes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground truncate">
              {displayTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{displayModule}</p>
          </div>
        </div>
        {canManage && Number.isFinite(parsedClassId) && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={() => setRosterOpen(true)}
            >
              <Users className="h-3.5 w-3.5" />
              Manage Students
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              disabled={deletingClass}
              onClick={() => void handleDeleteClass()}
            >
              {deletingClass ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Class
            </Button>
          </div>
        )}
      </header>

      <ClassStudentsDialog
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        classId={Number.isFinite(parsedClassId) ? parsedClassId : null}
        className={displayTitle}
        canManage={canManage}
      />

      {error ? (
        <p className="px-6 py-2 text-sm text-red-600 dark:text-red-400 shrink-0">{error}</p>
      ) : null}

      {!loading && !error && visibleTabs.length > 0 ? (
        <>
          <div className="shrink-0 px-4 sm:px-6 flex gap-1 border-b border-black/[0.06] dark:border-white/[0.08] overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={tab.id === "comments" ? handleCommentsTabOpen : () => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-violet-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {lessonTabLabel(
                  tab,
                  tab.id === "materials"
                    ? materialCount
                    : tab.id === "content"
                      ? lessonCount
                      : undefined
                )}
                {tab.id === "comments" && commentBadge > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {commentBadge > 9 ? "9+" : commentBadge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {activeTab === "content" && (
              <ClassCourseContent
                lessons={lessons}
                lesson={lesson}
                canManage={canManage}
                onSelectLesson={openLesson}
                onBackToList={clearLesson}
                onDeleteLesson={canManage ? handleDeleteLesson : undefined}
                deletingLessonId={deletingLessonId}
              />
            )}

            {needsLesson ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {canManage
                    ? `Open the ${lessonsTabLabel} tab and choose a lesson first.`
                    : `Choose a lesson on the ${lessonsTabLabel} tab to continue.`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => setActiveTab("content")}
                >
                  Go to {lessonsTabLabel}
                </Button>
              </div>
            ) : null}

            {activeTab === "materials" && lesson && (
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
                      Upload files
                    </label>
                  </div>
                )}
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {lesson.materials.length === 0 ? (
                    <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {canManage
                        ? "No files on this lesson yet. Attach files when assigning from Course Content (sidebar), or upload here."
                        : "No files for this lesson yet. Your teacher will share materials when they are ready."}
                    </li>
                  ) : (
                    lesson.materials.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatBytes(file.fileSizeBytes)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold shrink-0"
                          onClick={() => void handleDownload(file.id, file.fileName)}
                        >
                          Download
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            )}

            {activeTab === "ai" && lesson && (
              <div className="space-y-10">
                {!isTeacher ? (
                  <section className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      <h2 className="text-sm font-extrabold text-foreground">Lesson summary</h2>
                      <Badge className="text-[10px] font-bold bg-violet-600 text-white border-0">
                        {lesson.aiReady ? "Ready" : "Needs files"}
                      </Badge>
                    </div>

                    {isTeacher && lesson.materials.length > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">
                            Summarize from file
                          </label>
                          <select
                            value={summaryMaterialId}
                            onChange={(e) => setSummaryMaterialId(e.target.value)}
                            disabled={summaryGenerating}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                          className="h-9 gap-1.5 font-bold shrink-0"
                          disabled={summaryGenerating || !summaryMaterialId}
                          onClick={() => void handleGenerateSummary()}
                        >
                          {summaryGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {summaryGenerating
                            ? "Working…"
                            : displaySummary
                              ? "Regenerate"
                              : "Generate"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          Generate a summary from the lesson notes you are currently reading.
                        </p>
                        <Button
                          variant="inverse"
                          size="sm"
                          className="h-9 gap-1.5 font-bold shrink-0"
                          disabled={summaryGenerating}
                          onClick={() => void handleGenerateSummary()}
                        >
                          {summaryGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {summaryGenerating
                            ? "Working..."
                            : displaySummary
                              ? "Regenerate Summary"
                              : "Summarize Lesson"}
                        </Button>
                      </div>
                    )}

                    {summaryError ? (
                      <p className="text-xs text-red-600 dark:text-red-400 mb-3">{summaryError}</p>
                    ) : null}

                    {displaySummary ? (
                      <SummaryContent text={displaySummary} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Generate an AI summary of this lesson to review the key ideas.
                      </p>
                    )}

                    {displaySummary ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
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
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <section>
                  <LessonAskPanel
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    aiReady={lesson.aiReady}
                    hasLessonContent={Boolean(lesson.description?.trim())}
                  />
                </section>
              </div>
            )}

            {activeTab === "comments" && Number.isFinite(parsedClassId) ? (
              <div>
                <h2 className="text-sm font-extrabold text-foreground mb-4">Class discussion</h2>
                <ClassCommentsPanel classId={parsedClassId} canPost={canPostComments} />
              </div>
            ) : null}
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && visibleTabs.length === 0 ? (
        <p className="px-6 py-12 text-sm text-muted-foreground text-center">
          Could not load class tabs. Refresh the page or contact your administrator.
        </p>
      ) : null}
    </div>
  );
}
