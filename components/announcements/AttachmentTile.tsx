"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Paperclip, Loader2, X } from "lucide-react";
import {
  announcementService,
  type AnnouncementAttachment,
} from "@/lib/services/announcement-service";
import { cn } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";

function isImage(att: AnnouncementAttachment): boolean {
  return Boolean(att.contentType?.toLowerCase().startsWith("image/"));
}

interface AttachmentTileProps {
  announcementId: number;
  att: AnnouncementAttachment;
  /** Save-as handler used for non-image files (and the image fallback chip). */
  onDownload: () => void;
  /** "sm" for compact grid previews (e.g. the My Announcements card). Defaults to full size. */
  size?: "sm" | "md";
}

export function AttachmentTile({
  announcementId,
  att,
  onDownload,
  size = "md",
}: AttachmentTileProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isImage(att)) return;
    let active = true;
    setLoading(true);
    announcementService
      .downloadAttachment(announcementId, att.id)
      .then((blob) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [announcementId, att]);

  // Non-image, or image that failed to load → compact download chip.
  if (!isImage(att) || failed) {
    return (
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-black/6 bg-black/2 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-black/5 dark:border-white/8 dark:bg-white/3 dark:text-zinc-300 dark:hover:bg-white/8"
      >
        <Paperclip className="h-3 w-3 shrink-0" />
        <span className="truncate">{att.fileName}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => url && setLightboxOpen(true)}
        title={`${att.fileName} — click to preview`}
        className={cn(
          "group relative block shrink-0 overflow-hidden rounded-xl border border-black/6 bg-black/2 dark:border-white/8 dark:bg-white/3",
          size === "sm" ? "h-16 w-16" : "h-28 w-28",
        )}
      >
        {loading || !url ? (
          <span className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={att.fileName}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {size !== "sm" && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-[10px] font-medium text-white">
                {att.fileName}
              </span>
            )}
          </>
        )}
      </button>

      {/* In-page preview — no new tab/window. */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[92vw] w-full gap-0 overflow-hidden border-none bg-zinc-950 p-0 sm:max-w-3xl"
        >
          {/* Default close button is transparent-until-hover — invisible on a dark image backdrop, so it gets its own always-visible glass treatment here. */}
          <DialogClose
            aria-label="Close"
            className="liquid-glass-btn liquid-glass-btn-subtle absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </DialogClose>

          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={att.fileName}
              className="max-h-[75vh] w-full object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="truncate text-sm text-white/85">{att.fileName}</span>
            <button
              type="button"
              onClick={onDownload}
              className="liquid-glass-btn liquid-glass-btn-subtle inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
