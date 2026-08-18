"use client";

import { Pin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { isEmptyHtml } from "@/lib/html-text";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/lib/services/announcement-service";
import { AttachmentTile, isImageAttachment } from "./AttachmentTile";

interface AnnouncementReaderDialogProps {
  announcement: Announcement | null;
  onOpenChange: (open: boolean) => void;
  scopeLabel: (a: Announcement) => string;
  onDownload: (a: Announcement, attId: number, fileName: string) => void;
}

/** Read-only "article" view of an announcement, as another user sees it. */
export function AnnouncementReaderDialog({
  announcement,
  onOpenChange,
  scopeLabel,
  onDownload,
}: AnnouncementReaderDialogProps) {
  const a = announcement;
  const heroImage =
    a && a.attachments.length === 1 && isImageAttachment(a.attachments[0])
      ? a.attachments[0]
      : null;
  return (
    <Dialog open={a !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[88vh] overflow-y-auto rounded-2xl p-0",
          heroImage ? "max-w-4xl" : "max-w-2xl",
        )}
      >
        {a && (
          <article
            className={cn(
              heroImage
                ? "grid md:grid-cols-[1fr_0.85fr] md:items-stretch"
                : "flex flex-col",
            )}
          >
            <div className="flex min-w-0 flex-col">
            <DialogHeader className="space-y-3 px-6 pt-6 pb-4 text-left">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-600 dark:text-indigo-400">
                  {scopeLabel(a)}
                </span>
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Pin className="h-3 w-3 fill-amber-500 text-amber-500" /> Pinned
                  </span>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold leading-tight tracking-tight text-foreground">
                {a.title}
              </DialogTitle>
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  name={a.authorName}
                  avatarUrl={a.authorAvatarUrl}
                  className="h-8 w-8"
                  textClassName="text-[11px]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {a.authorName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatTimeAgo(a.createdAt)}
                    {a.editedAt ? " · edited" : ""}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="border-t border-border/50 px-2 pb-2">
              {isEmptyHtml(a.body) ? (
                <p className="px-4 py-6 text-sm italic text-muted-foreground">
                  No message body.
                </p>
              ) : (
                <RichTextEditor
                  html={a.body ?? ""}
                  onChange={() => {}}
                  readOnly
                  variant="apple"
                  placeholder=""
                />
              )}
            </div>

            {!heroImage && a.attachments.length > 0 && (
              <div className="border-t border-border/50 px-6 py-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {a.attachments.length}{" "}
                  {a.attachments.length === 1 ? "attachment" : "attachments"}
                </p>
                <div className="flex flex-wrap items-start gap-2">
                  {a.attachments.map((att) => (
                    <AttachmentTile
                      key={att.id}
                      announcementId={a.id}
                      att={att}
                      onDownload={() => onDownload(a, att.id, att.fileName)}
                    />
                  ))}
                </div>
              </div>
            )}
            </div>

            {heroImage && (
              <div className="min-h-64 border-t border-border/50 p-3 md:border-l md:border-t-0 md:p-4">
                <AttachmentTile
                  announcementId={a.id}
                  att={heroImage}
                  size="hero"
                  onDownload={() => onDownload(a, heroImage.id, heroImage.fileName)}
                />
              </div>
            )}
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
