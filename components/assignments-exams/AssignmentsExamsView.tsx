"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardPen,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  Paperclip,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { assignmentService } from "@/lib/services/assignment-service";
import { examService } from "@/lib/services/exam-service";
import { classService } from "@/lib/services/class-service";
import type {
  AssignmentDto,
  ExamDto,
} from "@/lib/types/assignments-exams-api";
import type { ClassSummary } from "@/lib/types/class-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useQueryState } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  formatQuizDueAt,
} from "@/lib/quiz-display";
import { downloadAuthedFile } from "@/lib/download";
import { ExamTakingView } from "./ExamTakingView";
import { TaskContentDisplay } from "./TaskContentDisplay";
import { AssignmentSubmissionsDialog } from "./AssignmentSubmissionsDialog";
import {
  CreateAssignmentDialog,
  CreateExamDialog,
} from "./CreateTaskDialogs";
import {
  ASSIGNMENTS_EXAMS_CONTENT_BUILDER,
  ASSIGNMENTS_EXAMS_TABS,
  canAccessAssignmentsExams,
} from "@/lib/assignments-exams-ui";

function workKindIcon(kind: "Assignment" | "Exam", className?: string) {
  return kind === "Exam" ? (
    <GraduationCap className={className} />
  ) : (
    <ClipboardPen className={className} />
  );
}

function canSubmitAssignment(item: AssignmentDto): boolean {
  return (
    item.status === "PUBLISHED" &&
    item.submissionStatus !== "SUBMITTED" &&
    !item.pastDue
  );
}

function canStartExam(item: ExamDto): boolean {
  return (
    item.status === "PUBLISHED" &&
    item.submissionStatus !== "SUBMITTED" &&
    item.submissionStatus !== "FAILED" &&
    !item.pastDue
  );
}

export function AssignmentsExamsView() {
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() ?? "student") as
    | "student"
    | "teacher"
    | "admin";
  const isTeacher = role === "teacher";
  const allowed = canAccessAssignmentsExams(role);

  const [activeTab, setActiveTab] = useQueryState(QueryKey.tab, "assignments");
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSummary[]>([]);

  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamDto | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentDto | null>(
    null,
  );
  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState<AssignmentDto | null>(
    null,
  );

  const { confirm, alert } = useConfirm();

  const tabs = ASSIGNMENTS_EXAMS_TABS;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentList, examList] = await Promise.all([
        isTeacher
          ? assignmentService.listForTeacher().catch(() => [])
          : assignmentService.listAssigned().catch(() => []),
        isTeacher
          ? examService.listForTeacher().catch(() => [])
          : examService.listAssigned().catch(() => []),
      ]);
      setAssignments(assignmentList);
      setExams(examList);
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isTeacher) return;
    classService
      .listClasses({ size: 100 })
      .then((page) => setClasses(page.items ?? []))
      .catch(() => setClasses([]));
  }, [isTeacher]);

  const handleSubmitAssignment = async () => {
    if (!activeAssignment) return;
    setSubmitting(true);
    try {
      const updated = await assignmentService.submit(
        activeAssignment.id,
        { content: submitContent.trim() },
        submitFile,
      );
      setActiveAssignment(updated);
      setSubmitFile(null);
      void loadData();
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not submit."), {
        title: "Submission failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignment = async (item: AssignmentDto) => {
    try {
      const full = await assignmentService.get(item.id);
      setSubmitContent(full.submittedContent ?? "");
      setSubmitFile(null);
      setActiveAssignment(full);
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not load assignment."), {
        variant: "destructive",
      });
    }
  };

  const startExam = async (item: ExamDto) => {
    try {
      const full = await examService.get(item.id);
      setActiveExam(full);
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not load exam."), {
        variant: "destructive",
      });
    }
  };

  if (!allowed) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-muted-foreground">
        Assignments &amp; Exams are not available for your role.
      </div>
    );
  }

  if (activeExam) {
    return (
      <ExamTakingView
        exam={activeExam}
        onExit={() => {
          setActiveExam(null);
          void loadData();
        }}
      />
    );
  }

  if (activeAssignment) {
    const submitted = activeAssignment.submissionStatus === "SUBMITTED";
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="shrink-0 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveAssignment(null)}
          >
            Back
          </Button>
        </div>
        <div
          className="rounded-2xl p-6 space-y-5 max-w-2xl mx-auto w-full"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border-color)",
          }}
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
              <ClipboardPen className="h-3.5 w-3.5" />
              Assignment
            </div>
            <h1 className="text-xl font-extrabold">{activeAssignment.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeAssignment.className}
              {formatQuizDueAt(activeAssignment.dueAt)
                ? ` · Due ${formatQuizDueAt(activeAssignment.dueAt)}`
                : ""}
            </p>
          </div>
          {activeAssignment.instructions ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-4 text-sm leading-relaxed">
              {activeAssignment.instructions}
            </div>
          ) : null}
          <TaskContentDisplay blocks={activeAssignment.contentBlocks} />
          {submitted ? (
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Submitted
                {activeAssignment.submissionScorePercent != null ? (
                  <span className="ml-auto tabular-nums text-emerald-600 dark:text-emerald-300">
                    {Math.round(activeAssignment.submissionScorePercent)}% on this assignment
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                Your class grade is updated using the score breakdown weights configured by your teacher.
              </p>
              {activeAssignment.submittedContent ? (
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {activeAssignment.submittedContent}
                </p>
              ) : null}
              {activeAssignment.submittedAttachmentUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    void downloadAuthedFile(
                      activeAssignment.submittedAttachmentUrl!,
                      activeAssignment.submittedAttachmentName ?? "attachment",
                    ).catch((err) =>
                      void alert(
                        getApiErrorMessage(err, "Could not download."),
                        { variant: "destructive" },
                      ),
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  {activeAssignment.submittedAttachmentName ??
                    "Your attachment"}
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Your submission</Label>
                <textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-background px-4 py-3 text-sm resize-y"
                  placeholder="Write your answer or paste your work here…"
                />
              </div>
              <div className="space-y-2">
                <Label>Attachment (optional)</Label>
                <input
                  type="file"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
                />
                {submitFile ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    {submitFile.name}
                  </p>
                ) : null}
              </div>
              <Button
                disabled={
                  submitting || !submitContent.trim() || activeAssignment.pastDue
                }
                className={cn(glassBtnPrimaryClass, "w-full h-11 rounded-xl")}
                style={{ background: "#305FC9" }}
                onClick={() => void handleSubmitAssignment()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit assignment
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden gap-5">
      <div className="flex gap-2 flex-wrap shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-9 px-4 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2",
              activeTab === tab.id
                ? "bg-[#305FC9] text-white shadow-md"
                : "bg-white/60 dark:bg-zinc-900/50 border border-black/6 dark:border-white/8 text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.id === "exams" ? (
              <GraduationCap className="h-4 w-4 shrink-0" />
            ) : (
              <ClipboardPen className="h-4 w-4 shrink-0" />
            )}
            {tab.label}
          </button>
        ))}
        {isTeacher ? (
          <button
            type="button"
            className={cn(
              glassBtnPrimaryClass,
              "ml-auto h-9 px-4 rounded-xl text-sm gap-1.5",
            )}
            style={{ background: "#305FC9" }}
            onClick={() =>
              activeTab === "exams"
                ? setCreateExamOpen(true)
                : setCreateAssignmentOpen(true)
            }
          >
            {activeTab === "exams" ? (
              <>
                <GraduationCap className="h-4 w-4" />
                New exam
              </>
            ) : (
              <>
                <ClipboardPen className="h-4 w-4" />
                New assignment
              </>
            )}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "exams" ? (
        <ItemGrid
          emptyLabel={
            isTeacher
              ? "No exams yet. Create one for your class."
              : "No exams assigned yet."
          }
          items={exams}
          renderItem={(exam) => (
            <WorkCard
              key={exam.id}
              kind="Exam"
              title={exam.title}
              className={exam.className}
              dueAt={exam.dueAt}
              pastDue={exam.pastDue}
              meta={`${exam.questionCount} questions${exam.durationMinutes ? ` · ${exam.durationMinutes} min` : ""}`}
              status={exam.submissionStatus}
              isTeacher={isTeacher}
              canStart={canStartExam(exam)}
              onOpen={() => void startExam(exam)}
              onDelete={
                isTeacher
                  ? () =>
                      void deleteExam(exam, confirm, loadData, alert)
                  : undefined
              }
            />
          )}
        />
      ) : (
        <ItemGrid
          emptyLabel={
            isTeacher
              ? "No assignments yet. Create one for your class."
              : "No assignments yet."
          }
          items={assignments}
          renderItem={(assignment) => (
            <WorkCard
              key={assignment.id}
              kind="Assignment"
              title={assignment.title}
              className={assignment.className}
              dueAt={assignment.dueAt}
              pastDue={assignment.pastDue}
              meta={
                isTeacher && assignment.submittedCount != null
                  ? `${assignment.submittedCount} submitted`
                  : undefined
              }
              status={assignment.submissionStatus}
              isTeacher={isTeacher}
              canStart={canSubmitAssignment(assignment)}
              onOpen={() => void openAssignment(assignment)}
              onReview={
                isTeacher ? () => setReviewAssignment(assignment) : undefined
              }
              onDelete={
                isTeacher
                  ? () =>
                      void deleteAssignment(assignment, confirm, loadData, alert)
                  : undefined
              }
            />
          )}
        />
      )}

      <CreateAssignmentDialog
        open={createAssignmentOpen}
        onOpenChange={setCreateAssignmentOpen}
        classes={classes}
        contentLabels={ASSIGNMENTS_EXAMS_CONTENT_BUILDER}
        onCreated={() => {
          setCreateAssignmentOpen(false);
          void loadData();
        }}
      />
      <CreateExamDialog
        open={createExamOpen}
        onOpenChange={setCreateExamOpen}
        classes={classes}
        contentLabels={ASSIGNMENTS_EXAMS_CONTENT_BUILDER}
        onCreated={() => {
          setCreateExamOpen(false);
          void loadData();
        }}
      />
      <AssignmentSubmissionsDialog
        assignment={reviewAssignment}
        onClose={() => setReviewAssignment(null)}
        onGraded={() => void loadData()}
      />
    </div>
  );
}

async function deleteAssignment(
  item: AssignmentDto,
  confirm: ReturnType<typeof useConfirm>["confirm"],
  reload: () => void,
  alert: ReturnType<typeof useConfirm>["alert"],
) {
  const ok = await confirm(`Delete "${item.title}"?`, {
    title: "Delete assignment",
    confirmLabel: "Delete",
    variant: "destructive",
  });
  if (!ok) return;
  try {
    await assignmentService.delete(item.id);
    reload();
  } catch (err) {
    void alert(getApiErrorMessage(err, "Could not delete."), { variant: "destructive" });
  }
}

async function deleteExam(
  item: ExamDto,
  confirm: ReturnType<typeof useConfirm>["confirm"],
  reload: () => void,
  alert: ReturnType<typeof useConfirm>["alert"],
) {
  const ok = await confirm(`Delete "${item.title}"?`, {
    title: "Delete exam",
    confirmLabel: "Delete",
    variant: "destructive",
  });
  if (!ok) return;
  try {
    await examService.delete(item.id);
    reload();
  } catch (err) {
    void alert(getApiErrorMessage(err, "Could not delete."), { variant: "destructive" });
  }
}

function ItemGrid<T>({
  items,
  emptyLabel,
  renderItem,
}: {
  items: T[];
  emptyLabel: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16 rounded-2xl border border-dashed border-black/10">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => renderItem(item))}
    </div>
  );
}

function WorkCard({
  kind,
  title,
  className,
  dueAt,
  pastDue,
  meta,
  status,
  isTeacher,
  canStart,
  onOpen,
  onReview,
  onDelete,
}: {
  kind: "Assignment" | "Exam";
  title: string;
  className: string;
  dueAt: string | null;
  pastDue: boolean;
  meta?: string;
  status?: string | null;
  isTeacher: boolean;
  canStart: boolean;
  onOpen: () => void;
  onReview?: () => void;
  onDelete?: () => void;
}) {
  const dueLabel = formatQuizDueAt(dueAt);
  const isExam = kind === "Exam";
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 border border-black/6 dark:border-white/8"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isExam
              ? "bg-violet-500/12 text-violet-600 dark:text-violet-400"
              : "bg-sky-500/12 text-sky-600 dark:text-sky-400",
          )}
        >
          {workKindIcon(kind, "h-5 w-5")}
        </div>
        {pastDue && status !== "SUBMITTED" ? (
          <Badge className="bg-zinc-600 text-white text-[10px]">Past due</Badge>
        ) : null}
      </div>
      <div>
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide mb-1",
            isExam ? "text-violet-600 dark:text-violet-400" : "text-sky-600 dark:text-sky-400",
          )}
        >
          {kind}
        </p>
        <h3 className="font-extrabold text-sm leading-snug">{title}</h3>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-1 flex-1">
        <p className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {className}
        </p>
        {dueLabel ? (
          <p className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Due {dueLabel}
          </p>
        ) : null}
        {meta ? (
          <p className="flex items-center gap-1">
            {workKindIcon(kind, "h-3.5 w-3.5 shrink-0 opacity-70")}
            {meta}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2 mt-1">
        {isTeacher ? (
          <>
            {onReview ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1.5"
                onClick={onReview}
              >
                <Users className="h-3.5 w-3.5" />
                {meta ?? "Review submissions"}
              </Button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-1 text-xs text-muted-foreground py-2">
                {isExam ? (
                  <>
                    <GraduationCap className="h-3.5 w-3.5" />
                    Proctored exam
                  </>
                ) : (
                  <>
                    <ClipboardPen className="h-3.5 w-3.5" />
                    {meta ?? "Awaiting submissions"}
                  </>
                )}
              </div>
            )}
            {onDelete ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </>
        ) : canStart ? (
          <Button size="sm" className="w-full text-xs gap-1.5" onClick={onOpen}>
            {isExam ? (
              <>
                <GraduationCap className="h-3.5 w-3.5" />
                Start exam
              </>
            ) : (
              <>
                <ClipboardPen className="h-3.5 w-3.5" />
                Open assignment
              </>
            )}
          </Button>
        ) : status === "SUBMITTED" ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 w-full py-2">
            <CheckCircle2 className="h-4 w-4" />
            Submitted
          </div>
        ) : status === "FAILED" ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 w-full py-2">
            <AlertTriangle className="h-4 w-4" />
            Failed
          </div>
        ) : pastDue ? (
          <div className="text-xs text-muted-foreground text-center w-full py-2">
            Past due
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={onOpen}>
            View
          </Button>
        )}
      </div>
    </div>
  );
}
