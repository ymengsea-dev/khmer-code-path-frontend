"use client";

import { useEffect, useState } from "react";
import {
  ClipboardPen,
  GraduationCap,
  Timer,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { assignmentService } from "@/lib/services/assignment-service";
import { examService } from "@/lib/services/exam-service";
import type { ClassSummary } from "@/lib/types/class-api";
import { fromDatetimeLocalValue } from "@/lib/quiz-display";
import {
  draftToContentBlocks,
  emptyTaskContentDraft,
  mergeAiGeneratedContent,
  taskContentDraftAiQuestionCount,
  taskContentDraftHasContent,
  type TaskContentDraft,
} from "@/lib/task-content-draft";
import type { ContentBuilderLabels } from "@/lib/assignments-exams-ui";
import {
  GlassInput,
  GlassSelect,
  glassInputClass,
  solidFieldClass,
} from "@/components/ui/glass-field";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { TaskContentBuilder } from "./TaskContentBuilder";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "./TaskCreateDialogShell";

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  classes,
  contentLabels,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassSummary[];
  contentLabels: ContentBuilderLabels;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [classId, setClassId] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [contentDraft, setContentDraft] = useState<TaskContentDraft>(
    emptyTaskContentDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setInstructions("");
    setDueAtLocal("");
    setContentDraft(emptyTaskContentDraft());
    setError(null);
    if (classes.length > 0) setClassId(String(classes[0].id));
  }, [open, classes]);

  const handleCreate = async () => {
    if (!title.trim() || !classId) return;
    setSaving(true);
    setError(null);
    try {
      const contentBlocks = taskContentDraftHasContent(contentDraft)
        ? draftToContentBlocks(contentDraft)
        : undefined;
      await assignmentService.create({
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        classId: Number(classId),
        dueAt: fromDatetimeLocalValue(dueAtLocal),
        contentBlocks,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create assignment."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={ClipboardPen}
      title="New assignment"
      description="Give students clear instructions, set a deadline, and optionally attach AI questions, files, or library materials."
      headerGradient="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent"
      iconClassName="bg-primary/15 text-primary ring-primary/25"
      saving={saving}
      canSubmit={Boolean(title.trim() && classId)}
      submitLabel="Publish assignment"
      onSubmit={() => void handleCreate()}
      error={error}
    >
      <FormSection
        title="Assignment details"
        description="Core info students see when they open the task."
      >
        <FormField label="Title">
          <GlassInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 3 programming exercise"
            autoFocus
            className={solidFieldClass}
          />
        </FormField>

        <FormField
          label="Instructions"
          hint="Explain what to submit and any formatting requirements."
        >
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="What should students do and submit?"
            className={cn(glassInputClass, "h-auto min-h-[7.5rem] resize-y py-3 leading-relaxed", solidFieldClass)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Class">
            <GlassSelect
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={cn("w-full", solidFieldClass)}
            >
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </GlassSelect>
          </FormField>

          <FormField label="Deadline">
            <DateTimePicker
              value={dueAtLocal}
              onChange={setDueAtLocal}
              placeholder="No deadline — pick a date & time"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title={contentLabels.sectionTitle}
        description={contentLabels.emptyContentHint}
      >
        <TaskContentBuilder
          labels={contentLabels}
          value={contentDraft}
          onChange={setContentDraft}
        />
      </FormSection>
    </TaskCreateDialogShell>
  );
}

export function CreateExamDialog({
  open,
  onOpenChange,
  classes,
  contentLabels,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassSummary[];
  contentLabels: ContentBuilderLabels;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [duration, setDuration] = useState("45");
  const [contentDraft, setContentDraft] = useState<TaskContentDraft>(
    emptyTaskContentDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDueAtLocal("");
    setDuration("45");
    setContentDraft(emptyTaskContentDraft());
    setError(null);
    if (classes.length > 0) setClassId(String(classes[0].id));
  }, [open, classes]);

  const handleCreate = async () => {
    if (!title.trim() || !classId) return;
    setSaving(true);
    setError(null);
    try {
      const questionCount = taskContentDraftAiQuestionCount(contentDraft);
      const contentBlocks = taskContentDraftHasContent(contentDraft)
        ? draftToContentBlocks(contentDraft)
        : undefined;
      await examService.create({
        title: title.trim(),
        classId: Number(classId),
        dueAt: fromDatetimeLocalValue(dueAtLocal),
        durationMinutes: Number(duration) || 45,
        generatedContent: mergeAiGeneratedContent(contentDraft),
        questionCount: questionCount > 0 ? questionCount : 0,
        contentBlocks,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create exam."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={GraduationCap}
      title="New proctored exam"
      description="Timed, locked-down assessment. Students must stay on the page for the full attempt."
      headerGradient="bg-gradient-to-br from-violet-500/18 via-purple-500/10 to-transparent"
      iconClassName="bg-violet-500/15 text-violet-600 ring-violet-500/25 dark:text-violet-400"
      saving={saving}
      canSubmit={Boolean(title.trim() && classId)}
      submitLabel="Publish exam"
      onSubmit={() => void handleCreate()}
      error={error}
    >
      <FormSection
        title="Exam settings"
        description="Timing and class assignment for this proctored session."
      >
        <FormField label="Title">
          <GlassInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mid-term exam — Module 2"
            autoFocus
            className={solidFieldClass}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Class">
            <GlassSelect
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={cn("w-full", solidFieldClass)}
            >
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </GlassSelect>
          </FormField>

          <FormField label="Duration" hint="How long students have once they start.">
            <div className="relative">
              <Timer className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <GlassInput
                type="number"
                min={5}
                max={480}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={cn("pl-10", solidFieldClass)}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Deadline">
          <div className="max-w-sm">
            <DateTimePicker
              value={dueAtLocal}
              onChange={setDueAtLocal}
              placeholder="No deadline — pick a date & time"
            />
          </div>
        </FormField>
      </FormSection>

      <FormSection
        title={contentLabels.sectionTitle}
        description={contentLabels.emptyContentHint}
      >
        <TaskContentBuilder
          labels={contentLabels}
          value={contentDraft}
          onChange={setContentDraft}
        />
      </FormSection>
    </TaskCreateDialogShell>
  );
}
