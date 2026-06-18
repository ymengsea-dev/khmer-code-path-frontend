"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
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
import {
  lessonTabLabel,
  resolveLessonTab,
} from "@/lib/course-content/lesson-tabs";
import type { LessonTabDto } from "@/lib/types/class-api";
import type { LessonDetailDto, LessonSummaryDto } from "@/lib/types/lesson-api";
import { getValidAccessToken } from "@/lib/auth/client-session";
import { ClassCourseContent } from "@/components/lessons/ClassCourseContent";
import { SelectionNotePopup } from "@/components/lessons/SelectionNotePopup";
import { LessonAskPanel } from "@/components/lessons/LessonAskPanel";
import { LessonRichContent } from "@/components/lessons/LessonRichContent";
import { ClassCommentsPanel } from "@/components/classes/ClassCommentsPanel";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useNotifications } from "@/components/notifications/notification-context";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { glassBtnSubtleClass } from "@/components/ui/glass-field";

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
      html.push(
        `<h3>${escapeHtml(cleanSummaryLine(line).replace(/:$/, ""))}</h3>`,
      );
      continue;
    }

    if (bullet || numbered) {
      const nextListType = numbered ? "ol" : "ul";
      if (listType !== nextListType) {
        closeList();
        html.push(`<${nextListType}>`);
        listType = nextListType;
      }
      html.push(
        `<li>${escapeHtml(cleanSummaryLine(bullet?.[1] ?? numbered?.[1] ?? line))}</li>`,
      );
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
    <div className="rounded-xl border border-white/30 bg-white/45 dark:bg-white/6 p-4 space-y-3">
      {blocks.map((line, index) => {
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        const numbered = line.match(/^\d+[.)]\s+(.+)$/);
        const looksLikeHeading =
          /^#{1,6}\s+/.test(line) ||
          (line.endsWith(":") && line.length <= 80 && !bullet && !numbered);

        if (looksLikeHeading) {
          return (
            <h3
              key={`${line}-${index}`}
              className="text-sm font-extrabold text-foreground"
            >
              {cleanSummaryLine(line).replace(/:$/, "")}
            </h3>
          );
        }

        if (bullet || numbered) {
          return (
            <div
              key={`${line}-${index}`}
              className="flex gap-2 text-sm leading-relaxed"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-500" />
              <p className="text-foreground/90">
                {cleanSummaryLine(bullet?.[1] ?? numbered?.[1] ?? line)}
              </p>
            </div>
          );
        }

        return (
          <p
            key={`${line}-${index}`}
            className="text-sm text-foreground/90 leading-relaxed"
          >
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
  onLessonOpen?: (title: string) => void;
  onLessonClose?: () => void;
  /** Stable callback ref assigned by parent so parent can trigger clearLesson */
  clearLessonRef?: React.MutableRefObject<(() => void) | null>;
  onBackToClasses?: () => void;
  onBackToClassDetail?: () => void;
}

export function LessonsView({
  classId,
  lessonIdParam,
  classTitle,
  classModule,
  onLessonOpen,
  onLessonClose,
  clearLessonRef,
  onBackToClasses,
  onBackToClassDetail,
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
  const [improveGoal, setImproveGoal] = useState(
    "Improve clarity, add learning objectives, examples, and short exercises.",
  );
  const [improvingLesson, setImprovingLesson] = useState(false);
  const [improvedContent, setImprovedContent] = useState<string | null>(null);

  const parsedClassId = classId ? Number(classId) : NaN;
  const isTeacher = role === "teacher" || role === "admin";
  const canManage = isTeacher;
  const canPostComments = role === "student" || isTeacher;

  const { notifications, markRead } = useNotifications();
  const unreadCommentNotifs = notifications.filter(
    (n) =>
      n.notificationType === "CLASS_QUESTION" &&
      n.classId === parsedClassId &&
      !n.read,
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
    [setParams],
  );

  // Keep callback props in refs so they never appear in effect dep arrays
  const onLessonOpenRef = useRef(onLessonOpen);
  const onLessonCloseRef = useRef(onLessonClose);
  useEffect(() => {
    onLessonOpenRef.current = onLessonOpen;
  }, [onLessonOpen]);
  useEffect(() => {
    onLessonCloseRef.current = onLessonClose;
  }, [onLessonClose]);

  const clearLesson = useCallback(() => {
    setLesson(null);
    setParams({ [QueryKey.lessonId]: null });
    onLessonCloseRef.current?.();
  }, [setParams]);

  // Expose clearLesson to parent via ref
  useEffect(() => {
    if (clearLessonRef) clearLessonRef.current = clearLesson;
  }, [clearLesson, clearLessonRef]);

  const loadLessonDetail = useCallback(async (lessonId: number) => {
    try {
      const detail = await lessonService.getLesson(lessonId);
      setLesson(detail);
      setError(null);
      onLessonOpenRef.current?.(detail.title);
    } catch {
      setLesson(null);
      setError("Could not load this lesson.");
    }
  }, []); // stable — uses refs for callbacks

  const openLesson = useCallback(
    (id: number) => {
      selectLesson(id);
      void loadLessonDetail(id);
    },
    [selectLesson, loadLessonDetail],
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
      if (
        Number.isFinite(selectedId) &&
        list.some((l) => l.id === selectedId)
      ) {
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
    setImprovedContent(null);
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
          : await lessonAiService.generateSummaryFromLesson(
              lesson.id,
              materialId,
            );
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
          : "Summary could not be generated. This lesson may not have written notes yet.",
      );
    } finally {
      setSummaryGenerating(false);
    }
  };

  const handleImproveLesson = async (persist: boolean) => {
    if (!lesson) return;
    setImprovingLesson(true);
    try {
      const result = await lessonAiService.improveLesson(lesson.id, {
        goal: improveGoal,
        persist,
      });
      setImprovedContent(result.improvedContent);
      if (result.persisted) {
        setLesson({ ...lesson, description: result.improvedContent });
        void showAlert("Improved lesson content saved.", {
          title: "Lesson updated",
          variant: "success",
        });
      }
    } catch {
      void showAlert("Could not improve this lesson content.", {
        title: "AI improvement failed",
        variant: "destructive",
      });
    } finally {
      setImprovingLesson(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lesson || !e.target.files?.length) return;
    setUploading(true);
    try {
      await lessonService.uploadMaterials(
        lesson.id,
        Array.from(e.target.files),
      );
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

  const handleQueueMaterialIndex = async (materialId: number) => {
    if (!lesson) return;
    try {
      const status = await lessonAiService.queueMaterialIndex(
        lesson.id,
        materialId,
      );
      void showAlert(`AI indexing status: ${status.status}`, {
        title: "Indexing queued",
        variant: "success",
      });
      await loadLessonDetail(lesson.id);
    } catch {
      void showAlert("Could not queue AI indexing for this file.", {
        title: "Indexing failed",
        variant: "destructive",
      });
    }
  };

  const [bottomPanel, setBottomPanel] = useState<"comments" | "materials">(
    "comments",
  );
  const [showBottom, setShowBottom] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [aiWidth, setAiWidth] = useState(360);
  const [bottomHeight, setBottomHeight] = useState(240);
  const [dragging, setDragging] = useState(false);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const materialCount = lesson?.materials?.length ?? 0;

  const AI_COLLAPSE_THRESHOLD = 160;
  const BOTTOM_COLLAPSE_THRESHOLD = 60;

  // Drag-to-resize AI panel — works for both collapse and expand-from-zero
  const startAiDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    // When collapsed panel has width=0; use saved aiWidth so dragging left opens to last width
    const startW = aiPanelRef.current ? aiPanelRef.current.offsetWidth : 0;
    const onMove = (ev: MouseEvent) => {
      const raw = startW - (ev.clientX - startX);
      const w = raw < AI_COLLAPSE_THRESHOLD ? 0 : Math.min(600, raw);
      if (aiPanelRef.current) aiPanelRef.current.style.width = `${w}px`;
    };
    const onUp = (ev: MouseEvent) => {
      const raw = startW - (ev.clientX - startX);
      if (aiPanelRef.current) aiPanelRef.current.style.width = "";
      if (raw < AI_COLLAPSE_THRESHOLD) {
        setShowAI(false);
      } else {
        setAiWidth(Math.min(600, Math.max(AI_COLLAPSE_THRESHOLD, raw)));
        setShowAI(true);
      }
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // Drag-to-resize bottom panel — works for both collapse and expand-from-zero
  const startBottomDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const startY = e.clientY;
    const startH = bottomPanelRef.current
      ? bottomPanelRef.current.offsetHeight
      : 0;
    const onMove = (ev: MouseEvent) => {
      const raw = startH - (ev.clientY - startY);
      const h = raw < BOTTOM_COLLAPSE_THRESHOLD ? 0 : Math.min(480, raw);
      if (bottomPanelRef.current)
        bottomPanelRef.current.style.height = `${h}px`;
    };
    const onUp = (ev: MouseEvent) => {
      const raw = startH - (ev.clientY - startY);
      if (bottomPanelRef.current) bottomPanelRef.current.style.height = "";
      if (raw < BOTTOM_COLLAPSE_THRESHOLD) {
        setShowBottom(false);
      } else {
        setBottomHeight(
          Math.min(480, Math.max(BOTTOM_COLLAPSE_THRESHOLD, raw)),
        );
        setShowBottom(true);
      }
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-clip">
      {/* Teacher action bar */}
      {canManage && Number.isFinite(parsedClassId) && onBackToClassDetail && (
        <div className="shrink-0 py-2.5">
          <button
            type="button"
            onClick={onBackToClassDetail}
            className={cn(glassBtnSubtleClass, "h-8 px-3 text-xs font-semibold gap-1.5")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Class details
          </button>
        </div>
      )}

      {error && (
        <p className="px-6 py-2 text-sm text-zinc-600 shrink-0">{error}</p>
      )}

      {!loading &&
        !error &&
        (lesson ? (
          /* ── 3-panel lesson reader ── */
          <div
            className="flex-1 flex min-h-0 overflow-hidden pt-1 pb-1 pr-1 gap-0"
            style={{ userSelect: dragging ? "none" : undefined }}
          >
            <SelectionNotePopup
              containerIds={["lesson-content-area", "ai-panel-messages"]}
              lessonTitle={lesson.title}
              lessonId={lesson.id}
            />
            {/* LEFT column */}
            <div className="relative flex-1 flex flex-col min-h-0 min-w-0 gap-0 overflow-hidden">
              {/* ── Floating toolbar — absolutely positioned over the lesson content ── */}
              <div className="absolute top-2 left-2 right-4 z-10 flex items-center justify-between gap-2 pointer-events-none">
                {/* Left: back + lesson title pill */}
                <div className="flex items-center gap-1.5 min-w-0 pointer-events-auto">
                  <button
                    type="button"
                    onClick={clearLesson}
                    aria-label="Back to lessons"
                    className="shrink-0 h-8 w-8 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "var(--glass-bg)",
                      backdropFilter: "blur(16px) saturate(1.5)",
                      WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                      border: "1px solid var(--glass-border-color)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-zinc-600" />
                  </button>
                  <div
                    className="h-8 px-3 rounded-2xl flex items-center min-w-0 max-w-[260px]"
                    style={{
                      background: "var(--glass-bg)",
                      backdropFilter: "blur(16px) saturate(1.5)",
                      WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                      border: "1px solid var(--glass-border-color)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    }}
                  >
                    <span className="text-xs font-semibold text-zinc-700 truncate">
                      {lesson.title}
                    </span>
                  </div>
                </div>

                {/* Right: toggle comments + toggle AI */}
                <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showBottom) {
                        unreadCommentNotifs.forEach((n) => void markRead(n.id));
                      }
                      setShowBottom((v) => !v);
                    }}
                    className="h-8 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    style={
                      showBottom
                        ? {
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(16px) saturate(1.5)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                            border: "1px solid var(--glass-border-color)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                            color: "#18181b",
                          }
                        : {
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(16px) saturate(1.5)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                            border: "1px solid var(--glass-border-color)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                            color: "#a1a1aa",
                          }
                    }
                  >
                    <MessageSquare className="h-3 w-3" />
                    Comments
                    {commentBadge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-zinc-500/80 text-[9px] font-bold text-white">
                        {commentBadge > 9 ? "9+" : commentBadge}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAI((v) => !v)}
                    className="h-8 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    style={
                      showAI
                        ? {
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(16px) saturate(1.5)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                            border: "1px solid var(--glass-border-color)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                            color: "#18181b",
                          }
                        : {
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(16px) saturate(1.5)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                            border: "1px solid var(--glass-border-color)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                            color: "#a1a1aa",
                          }
                    }
                  >
                    <Sparkles className="h-3 w-3" />
                    AI
                  </button>
                </div>
              </div>

              {/* Lesson content — liquid glass card, fills full height */}
              <div
                id="lesson-content-area"
                className="flex-1 min-h-0 overflow-y-auto scrollbar-hide rounded-2xl pt-12"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                }}
              >
                <LessonRichContent
                  html={lesson.description}
                  emptyMessage={
                    canManage
                      ? "No notes yet. Write content in Content Management, then assign it to this class."
                      : "Your teacher has not published notes for this lesson yet."
                  }
                />
              </div>

              {/* Vertical drag strip */}
              <div
                onMouseDown={startBottomDrag}
                className="shrink-0 flex items-center justify-center cursor-row-resize group py-[3px]"
              >
                <div className="w-10 h-1 rounded-full bg-zinc-400/90 dark:bg-zinc-500 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors" />
              </div>

              {/* Bottom panel — always in DOM, height 0 when collapsed */}
              <div
                ref={bottomPanelRef}
                className={cn(
                  "shrink-0 flex flex-col rounded-2xl overflow-hidden",
                  !dragging && "transition-[height] duration-200",
                )}
                style={{
                  height: showBottom ? bottomHeight : 0,
                  ...(showBottom
                    ? {
                        background: "var(--glass-bg)",
                        backdropFilter: "var(--glass-blur)",
                        WebkitBackdropFilter: "var(--glass-blur)",
                        border: "1px solid var(--glass-border-color)",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                      }
                    : {}),
                }}
              >
                {showBottom && (
                  <>
                    {/* Tab row */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 h-10">
                      {(["comments", "materials"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setBottomPanel(tab);
                            if (tab === "comments")
                              unreadCommentNotifs.forEach(
                                (n) => void markRead(n.id),
                              );
                          }}
                          className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-full transition-colors",
                            bottomPanel === tab
                              ? "bg-zinc-900 text-white"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/6",
                          )}
                        >
                          {tab === "comments"
                            ? "Comments"
                            : `Materials (${materialCount})`}
                        </button>
                      ))}
                      {bottomPanel === "materials" && canManage && (
                        <label className="inline-flex cursor-pointer items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-black/6 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.pptx,.docx,.ppt,.doc"
                            onChange={(e) => void handleUpload(e)}
                            disabled={uploading}
                          />
                          {uploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Upload
                        </label>
                      )}
                    </div>
                    {/* Tab content */}
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pb-3">
                      {bottomPanel === "comments" &&
                        Number.isFinite(parsedClassId) && (
                          <ClassCommentsPanel
                            classId={parsedClassId}
                            canPost={canPostComments}
                          />
                        )}
                      {bottomPanel === "materials" && (
                        <ul className="space-y-1">
                          {lesson.materials.length === 0 ? (
                            <li className="py-6 text-center text-xs text-muted-foreground">
                              {canManage
                                ? "No files yet. Upload above."
                                : "No files for this lesson yet."}
                            </li>
                          ) : (
                            lesson.materials.map((file) => (
                              <li
                                key={file.id}
                                className="flex items-center justify-between gap-3 py-2 rounded-xl px-2 hover:bg-black/4 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {file.fileName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatBytes(file.fileSizeBytes)}
                                    {file.ragStatus
                                      ? ` · AI: ${file.ragStatus}`
                                      : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isTeacher && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 font-semibold"
                                      onClick={() =>
                                        void handleQueueMaterialIndex(file.id)
                                      }
                                    >
                                      Index AI
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 font-semibold"
                                    onClick={() =>
                                      void handleDownload(
                                        file.id,
                                        file.fileName,
                                      )
                                    }
                                  >
                                    Download
                                  </Button>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Horizontal drag strip — 3px gap to course content and AI panel */}
            <div
              onMouseDown={startAiDrag}
              className="shrink-0 flex items-center justify-center cursor-col-resize self-stretch group px-[3px] py-[3px]"
            >
              <div className="w-1 min-h-[2.5rem] h-10 rounded-full bg-zinc-400/90 dark:bg-zinc-500 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors" />
            </div>

            {/* RIGHT: AI panel — always in DOM, width 0 when collapsed */}
            <div
              ref={aiPanelRef}
              className={cn(
                "shrink-0 flex flex-col min-h-0 overflow-hidden",
                showAI && "rounded-2xl",
                !dragging && "transition-[width] duration-200",
              )}
              style={{
                width: showAI ? aiWidth : 0,
                ...(showAI
                  ? {
                      background: "var(--glass-bg)",
                      backdropFilter: "var(--glass-blur)",
                      WebkitBackdropFilter: "var(--glass-blur)",
                      border: "1px solid var(--glass-border-color)",
                      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                    }
                  : {}),
              }}
            >
              {showAI &&
                (!isTeacher ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Compact header */}
                    <div className="shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="text-xs font-bold text-foreground">
                        AI Assistant
                      </span>
                    </div>

                    {/* Chat — fills remaining space, summary injected as chat message */}
                    <div className="flex-1 min-h-0">
                      <LessonAskPanel
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        aiReady={lesson.aiReady}
                        hasLessonContent={Boolean(lesson.description?.trim())}
                        materialId={
                          lesson.materials.length > 0
                            ? Number(
                                summaryMaterialId || lesson.materials[0].id,
                              )
                            : null
                        }
                        onSummarize={async () => {
                          const result =
                            await lessonAiService.generateSummaryFromLessonContent(
                              lesson.id,
                            );
                          return result.summary;
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 pt-3 pb-3 space-y-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-bold text-foreground">
                          AI Tools
                        </span>
                      </div>
                      <textarea
                        value={improveGoal}
                        onChange={(e) => setImproveGoal(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Tell AI how to improve this lesson…"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 gap-1.5 text-xs rounded-xl"
                          disabled={improvingLesson}
                          onClick={() => void handleImproveLesson(false)}
                        >
                          {improvingLesson ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 gap-1.5 text-xs rounded-xl"
                          disabled={improvingLesson}
                          onClick={() => void handleImproveLesson(true)}
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </Button>
                      </div>
                      {improvedContent && (
                        <div
                          className="rounded-xl p-3"
                          style={{
                            background: "var(--glass-bg-subtle)",
                            border: "1px solid var(--glass-border-color-subtle)",
                          }}
                        >
                          <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">
                            Preview
                          </p>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert text-xs"
                            dangerouslySetInnerHTML={{ __html: improvedContent }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 border-t border-border/40">
                      <LessonAskPanel
                        compactFooter
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        aiReady={lesson.aiReady}
                        hasLessonContent={Boolean(lesson.description?.trim())}
                        materialId={
                          lesson.materials.length > 0
                            ? Number(summaryMaterialId || lesson.materials[0].id)
                            : null
                        }
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* ── Lesson cards list ── */
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-6">
            <ClassCourseContent
              lessons={lessons}
              lesson={null}
              canManage={canManage}
              onSelectLesson={openLesson}
              onBackToList={clearLesson}
            />
          </div>
        ))}
    </div>
  );
}
