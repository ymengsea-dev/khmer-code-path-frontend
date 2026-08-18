"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { downloadAuthedFile } from "@/lib/download";
import { assignmentService } from "@/lib/services/assignment-service";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type {
  AssignmentDto,
  AssignmentSubmissionDto,
} from "@/lib/types/assignments-exams-api";

interface Props {
  assignment: AssignmentDto | null;
  onClose: () => void;
  onGraded: () => void;
}

export function AssignmentSubmissionsDialog({
  assignment,
  onClose,
  onGraded,
}: Props) {
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { alert } = useConfirm();

  const load = useCallback(async () => {
    if (!assignment) return;
    setLoading(true);
    try {
      setSubmissions(await assignmentService.getSubmissions(assignment.id));
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not load submissions."), {
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [assignment, alert]);

  useEffect(() => {
    if (assignment) void load();
  }, [assignment, load]);

  return (
    <Dialog
      open={assignment != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle>{assignment?.title ?? "Submissions"}</DialogTitle>
        <DialogDescription>
          Download attachments and grade each submission (0–100). Grades feed the
          weighted class score; ungraded submissions are not counted yet.
        </DialogDescription>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No submissions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <SubmissionRow
                key={s.submissionId}
                assignmentId={assignment!.id}
                submission={s}
                onGraded={() => {
                  void load();
                  onGraded();
                }}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({
  assignmentId,
  submission,
  onGraded,
}: {
  assignmentId: number;
  submission: AssignmentSubmissionDto;
  onGraded: () => void;
}) {
  const [score, setScore] = useState<string>(
    submission.scorePercent != null ? String(submission.scorePercent) : "",
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const { alert } = useConfirm();

  const graded = submission.scorePercent != null;

  const save = async () => {
    const value = Number(score);
    if (score.trim() === "" || Number.isNaN(value) || value < 0 || value > 100) {
      void alert("Enter a score between 0 and 100.", { variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await assignmentService.grade(assignmentId, submission.submissionId, {
        scorePercent: value,
        feedback: feedback.trim() || undefined,
      });
      onGraded();
    } catch (err) {
      void alert(getApiErrorMessage(err, "Could not save grade."), {
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/6 dark:border-white/8 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {submission.studentName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {submission.studentEmail}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            graded
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          )}
        >
          {graded ? `${Math.round(submission.scorePercent!)}%` : "Not graded"}
        </span>
      </div>

      {submission.content ? (
        <p className="text-sm whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-zinc-900/40 p-3">
          {submission.content}
        </p>
      ) : null}

      {submission.attachmentUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            void downloadAuthedFile(
              submission.attachmentUrl!,
              submission.attachmentName ?? "attachment",
            ).catch((err) =>
              void alert(getApiErrorMessage(err, "Could not download."), {
                variant: "destructive",
              }),
            )
          }
        >
          <Download className="h-4 w-4" />
          {submission.attachmentName ?? "Attachment"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          No attachment
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Score (0–100)</Label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="h-9 w-24 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[12rem]">
          <Label className="text-xs">Feedback (optional)</Label>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-background px-3 text-sm"
            placeholder="Short note for the student"
          />
        </div>
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {graded ? "Update" : "Save grade"}
        </Button>
      </div>
    </div>
  );
}
