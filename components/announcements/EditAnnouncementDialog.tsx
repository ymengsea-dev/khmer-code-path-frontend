"use client";

import { useEffect, useState } from "react";
import { Loader2, Paperclip, Pencil, X } from "lucide-react";
import { glassInputClass } from "@/components/ui/glass-field";
import {
  FormField,
  FormSection,
  TaskCreateDialogShell,
} from "@/components/assignments-exams/TaskCreateDialogShell";
import {
  announcementService,
  type Announcement,
  type AnnouncementAttachment,
} from "@/lib/services/announcement-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { isEmptyHtml } from "@/lib/html-text";

interface EditAnnouncementDialogProps {
  announcement: Announcement | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditAnnouncementDialog({
  announcement,
  onOpenChange,
  onSaved,
}: EditAnnouncementDialogProps) {
  const open = announcement !== null;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [existing, setExisting] = useState<AnnouncementAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!announcement) return;
    setTitle(announcement.title);
    setBody(announcement.body ?? "");
    setPinned(announcement.pinned);
    setExisting(announcement.attachments);
    setNewFiles([]);
    setError(null);
    setSaving(false);
  }, [announcement]);

  const canSubmit = title.trim().length > 0;

  const removeExisting = async (attId: number) => {
    if (!announcement) return;
    setRemovingId(attId);
    setError(null);
    try {
      await announcementService.deleteAttachment(announcement.id, attId);
      setExisting((prev) => prev.filter((att) => att.id !== attId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not remove the attachment."));
    } finally {
      setRemovingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!announcement || !canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await announcementService.update(announcement.id, {
        title: title.trim(),
        body: isEmptyHtml(body) ? "" : body,
        pinned,
      });
      if (newFiles.length > 0) {
        await announcementService.uploadAttachments(announcement.id, newFiles);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save changes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskCreateDialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Pencil}
      title="Edit announcement"
      description="Update the title, message, pin status, or attachments."
      headerGradient="bg-gradient-to-br from-indigo-500/15 via-indigo-500/8 to-transparent"
      iconClassName="bg-indigo-500/15 text-indigo-600 ring-indigo-500/25 dark:text-indigo-400"
      error={error}
      saving={saving}
      canSubmit={canSubmit}
      submitLabel="Save changes"
      onSubmit={() => void handleSubmit()}
    >
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
        description="Remove files instantly, or add new ones when you save. PDF, Word, PowerPoint, or images — up to 50 MB each."
      >
        {existing.length > 0 && (
          <ul className="space-y-1">
            {existing.map((att) => (
              <li
                key={att.id}
                className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/35 px-2.5 py-1.5 text-[11px] text-zinc-600 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300"
              >
                <Paperclip className="h-3 w-3 shrink-0" />
                <span className="truncate">{att.fileName}</span>
                <button
                  type="button"
                  disabled={removingId === att.id}
                  onClick={() => void removeExisting(att.id)}
                  className="ml-auto shrink-0 text-muted-foreground hover:text-rose-600 disabled:opacity-50"
                  aria-label={`Remove ${att.fileName}`}
                >
                  {removingId === att.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
          onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-500/20"
        />

        {newFiles.length > 0 && (
          <ul className="space-y-1">
            {newFiles.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-indigo-500" />
                <span className="truncate">{f.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">New</span>
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
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
