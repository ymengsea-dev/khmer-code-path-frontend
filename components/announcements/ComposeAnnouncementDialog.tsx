"use client";

import { useEffect, useState } from "react";
import { BookOpen, Building2, Megaphone, Paperclip, Users, X } from "lucide-react";
import { glassInputClass, glassSelectClass } from "@/components/ui/glass-field";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "@/components/assignments-exams/TaskCreateDialogShell";
import {
  announcementService,
  type AnnouncementRole,
  type AnnouncementScope,
} from "@/lib/services/announcement-service";
import { classService } from "@/lib/services/class-service";
import type { ClassSummary } from "@/lib/types/class-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { isEmptyHtml } from "@/lib/html-text";

interface ComposeAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "admin" | "teacher" | "student";
  onCreated?: () => void;
}

const ROLE_OPTIONS: AnnouncementRole[] = ["STUDENT", "TEACHER", "ADMIN"];

const SCOPE_SEGMENTS: { value: AnnouncementScope; label: string; icon: typeof BookOpen }[] = [
  { value: "CLASS", label: "Class", icon: BookOpen },
  { value: "SCHOOL", label: "School", icon: Building2 },
  { value: "ROLE", label: "Role", icon: Users },
];

export function ComposeAnnouncementDialog({
  open,
  onOpenChange,
  role,
  onCreated,
}: ComposeAnnouncementDialogProps) {
  const isAdmin = role === "admin";
  const [scope, setScope] = useState<AnnouncementScope>("CLASS");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [targetClassId, setTargetClassId] = useState<number | "">("");
  const [targetRole, setTargetRole] = useState<AnnouncementRole>("STUDENT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScope("CLASS");
    setTargetClassId("");
    setTargetRole("STUDENT");
    setTitle("");
    setBody("");
    setPinned(false);
    setFiles([]);
    setError(null);
    setSaving(false);
    void classService
      .listClasses({})
      .then((page) => setClasses(page.items))
      .catch(() => setClasses([]));
  }, [open]);

  const canSubmit = title.trim().length > 0 && (scope !== "CLASS" || targetClassId !== "");

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const created = await announcementService.create({
        scope,
        targetClassId: scope === "CLASS" ? Number(targetClassId) : undefined,
        targetRole: scope === "ROLE" ? targetRole : undefined,
        title: title.trim(),
        body: isEmptyHtml(body) ? undefined : body,
        pinned,
      });
      if (files.length > 0) {
        await announcementService.uploadAttachments(created.id, files);
      }
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not post the announcement. Check your inputs and try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Megaphone}
      title="New announcement"
      description="Broadcast an update. Recipients get a notification and see it in the feed."
      headerGradient="bg-gradient-to-br from-indigo-500/15 via-indigo-500/8 to-transparent"
      iconClassName="bg-indigo-500/15 text-indigo-600 ring-indigo-500/25 dark:text-indigo-400"
      error={error}
      saving={saving}
      canSubmit={canSubmit}
      submitLabel="Post announcement"
      onSubmit={() => void handleSubmit()}
    >
      <FormSection title="Audience" description="Choose who receives this announcement.">
        <FormField label="Send to">
          {isAdmin ? (
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/5">
              {SCOPE_SEGMENTS.map((seg) => {
                const SegIcon = seg.icon;
                const active = scope === seg.value;
                return (
                  <button
                    key={seg.value}
                    type="button"
                    onClick={() => setScope(seg.value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                      active
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-white/12 dark:text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <SegIcon className="h-3.5 w-3.5" />
                    {seg.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-indigo-500/[0.06] px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              One of your classes
            </div>
          )}
        </FormField>

        {scope === "CLASS" && (
          <FormField label="Class">
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value ? Number(e.target.value) : "")}
              className={cn(glassSelectClass, "w-full")}
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </FormField>
        )}

        {scope === "ROLE" && (
          <FormField label="Role">
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as AnnouncementRole)}
              className={cn(glassSelectClass, "w-full")}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}s
                </option>
              ))}
            </select>
          </FormField>
        )}
      </FormSection>

      <FormSection title="Message" description="What you want people to know.">
        <FormField label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s the update?"
            className={cn(glassInputClass, "h-11")}
          />
        </FormField>

        <FormField label="Message" hint="Write freely — format text, add headings, lists, links.">
          <RichTextEditor
            html={body}
            onChange={setBody}
            placeholder="Add the details…"
            className="min-h-64"
          />
        </FormField>

        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          className="flex w-full items-center justify-between rounded-xl border border-white/40 bg-white/35 px-3.5 py-2.5 text-left transition-colors hover:bg-white/50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8"
        >
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold text-foreground">Pin to top</span>
            <span className="block text-[11px] text-muted-foreground">
              Keep this above other announcements.
            </span>
          </span>
          <span
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
              pinned ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-600",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                pinned ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      </FormSection>

      <FormSection
        title="Attachments"
        description="PDF, Word, PowerPoint, or images — up to 50 MB each."
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-500/20"
        />
        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/35 px-2.5 py-1.5 text-[11px] text-zinc-600 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300"
              >
                <Paperclip className="h-3 w-3 shrink-0" />
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </TaskCreateDialogShell>
  );
}
