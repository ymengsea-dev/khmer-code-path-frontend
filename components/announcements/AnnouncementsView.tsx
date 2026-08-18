"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  ChevronDown,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Users,
} from "lucide-react";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { RichTextEditor } from "@/components/notebook/RichTextEditor";
import { AttachmentTile, isImageAttachment } from "./AttachmentTile";
import { AnnouncementReaderDialog } from "./AnnouncementReaderDialog";
import { isEmptyHtml, htmlToText } from "@/lib/html-text";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { ComposeAnnouncementDialog } from "@/components/announcements/ComposeAnnouncementDialog";
import { EditAnnouncementDialog } from "@/components/announcements/EditAnnouncementDialog";
import { announcementService, type Announcement } from "@/lib/services/announcement-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { cn } from "@/lib/utils";

type AnnouncementTab = "all" | "mine";

/** Article feed reveals this many announcements per "Show more" click. */
const FEED_PAGE_STEP = 5;

interface AnnouncementsViewProps {
  role: "admin" | "teacher" | "student";
}

/** Per-scope visual identity — soft Apple-style tints, one per audience. */
const SCOPE_THEME = {
  CLASS: {
    icon: BookOpen,
    tile: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    dot: "bg-indigo-500",
    chip: "text-indigo-600 dark:text-indigo-300",
  },
  SCHOOL: {
    icon: Building2,
    tile: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    dot: "bg-sky-500",
    chip: "text-sky-600 dark:text-sky-300",
  },
  ROLE: {
    icon: Users,
    tile: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
    chip: "text-violet-600 dark:text-violet-300",
  },
} as const;

function scopeLabel(a: Announcement): string {
  switch (a.scope) {
    case "CLASS":
      return a.targetClassName ?? "Class";
    case "SCHOOL":
      return "School-wide";
    case "ROLE":
      return a.targetRole
        ? `${a.targetRole.charAt(0)}${a.targetRole.slice(1).toLowerCase()}s`
        : "Role";
    default:
      return "";
  }
}

export function AnnouncementsView({ role }: AnnouncementsViewProps) {
  const { confirm } = useConfirm();
  const { data: currentUser } = useCurrentUser();
  const canCompose = role === "admin" || role === "teacher";
  const [tab, setTab] = useState<AnnouncementTab>("all");
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [reading, setReading] = useState<Announcement | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE_STEP);

  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE_STEP);
  }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await announcementService.list(0, 50);
      setItems(page.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load announcements."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePin = async (a: Announcement) => {
    setBusyId(a.id);
    try {
      await announcementService.update(a.id, { pinned: !a.pinned });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update the announcement."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (a: Announcement) => {
    const ok = await confirm(`Delete "${a.title}"?`, {
      title: "Delete announcement",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    setBusyId(a.id);
    try {
      await announcementService.remove(a.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete the announcement."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (a: Announcement, attId: number, fileName: string) => {
    try {
      const blob = await announcementService.downloadAttachment(a.id, attId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not download the attachment."));
    }
  };

  const visibleItems =
    canCompose && tab === "mine"
      ? items.filter((a) => a.authorId === currentUser?.userId)
      : items;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto space-y-4 pb-4">
      {canCompose && (
        <div
          className={cn(
            "sticky top-0 z-10 -mx-5 flex flex-wrap items-center gap-2 px-5 pt-1 pb-3",
            "bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70",
            "border-b border-zinc-200/50 dark:border-white/8",
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", label: "Announcements" },
                { id: "mine", label: "My Announcements" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-2xl transition-colors",
                  tab === t.id
                    ? "glass-btn-primary text-white shadow-sm"
                    : "liquid-glass-btn-subtle liquid-glass-btn text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "mine" && (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className={cn(glassBtnPrimaryClass, "ml-auto gap-2 h-10 px-4 shrink-0")}
            >
              <Megaphone className="h-4 w-4" /> New announcement
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Megaphone className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {tab === "mine" ? "You haven’t posted yet" : "No announcements yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === "mine"
                ? "Use “New announcement” to post your first one."
                : canCompose
                  ? "Post the first one to reach your students."
                  : "You’ll see updates here when they’re posted."}
            </p>
          </div>
        </div>
      ) : tab === "mine" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((a) => {
            const theme = SCOPE_THEME[a.scope] ?? SCOPE_THEME.CLASS;
            const ScopeIcon = theme.icon;
            return (
              <div
                key={a.id}
                className={cn(
                  "group/card glass-panel relative flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25",
                  a.pinned && "ring-1 ring-amber-400/40 bg-amber-50/40 dark:bg-amber-400/4",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      theme.tile,
                    )}
                  >
                    <ScopeIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide",
                          theme.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                        {scopeLabel(a)}
                      </span>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <Pin className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatTimeAgo(a.createdAt)}
                      {a.editedAt ? " · edited" : ""}
                    </p>
                  </div>

                  {a.canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="liquid-glass-btn liquid-glass-btn-subtle -mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                        aria-label="Manage announcement"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={busyId === a.id}
                          onClick={() => void togglePin(a)}
                        >
                          {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                          {a.pinned ? "Unpin" : "Pin to top"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(a)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={busyId === a.id}
                          onClick={() => void handleDelete(a)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Opens the read-only article view */}
                <button
                  type="button"
                  onClick={() => setReading(a)}
                  className="group/read block flex-1 text-left"
                >
                  <h3 className="text-[15px] font-bold leading-snug text-zinc-900 transition-colors group-hover/read:text-indigo-600 dark:text-zinc-50 dark:group-hover/read:text-indigo-400">
                    {a.title}
                  </h3>
                  {htmlToText(a.body) && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {htmlToText(a.body)}
                    </p>
                  )}
                </button>

                {a.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {a.attachments.slice(0, 3).map((att) => (
                      <AttachmentTile
                        key={att.id}
                        announcementId={a.id}
                        att={att}
                        size="sm"
                        onDownload={() =>
                          void handleDownload(a, att.id, att.fileName)
                        }
                      />
                    ))}
                    {a.attachments.length > 3 && (
                      <span className="inline-flex h-8 items-center rounded-lg border border-black/6 bg-black/2 px-2 text-[11px] font-semibold text-muted-foreground dark:border-white/8 dark:bg-white/3">
                        +{a.attachments.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/8">
                  <UserAvatar name={a.authorName} avatarUrl={a.authorAvatarUrl} className="h-5 w-5" textClassName="text-[8px]" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {a.authorName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReading(a)}
                    className="ml-auto text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleItems.slice(0, feedVisibleCount).map((a) => {
            const theme = SCOPE_THEME[a.scope] ?? SCOPE_THEME.CLASS;
            const bodyEmpty = isEmptyHtml(a.body);
            const heroImage =
              a.attachments.length === 1 && isImageAttachment(a.attachments[0])
                ? a.attachments[0]
                : null;
            return (
              <article
                key={a.id}
                className="glass-panel relative overflow-hidden rounded-3xl"
              >
                <div className="px-6 pt-7 md:px-8 md:pt-9">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
                          theme.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                        {scopeLabel(a)}
                      </span>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          <Pin className="h-3 w-3 fill-amber-500 text-amber-500" /> Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <UserAvatar
                        name={a.authorName}
                        avatarUrl={a.authorAvatarUrl}
                        className="h-9 w-9"
                        textClassName="text-[12px]"
                      />
                      <div className="min-w-0 text-right">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {a.authorName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatTimeAgo(a.createdAt)}
                          {a.editedAt ? " · edited" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="font-editorial mt-3 text-[26px] font-semibold leading-[1.15] tracking-tight text-zinc-900 sm:text-[32px] dark:text-zinc-50">
                    {a.title}
                  </h2>
                </div>

                <div className="mt-5" />

                {heroImage ? (
                  /* Single image → text left, large image right */
                  <div className="grid gap-4 px-6 pb-8 md:grid-cols-[1fr_0.8fr] md:items-stretch md:px-8">
                    <div className="min-w-0 self-start">
                      {bodyEmpty ? (
                        <p className="py-2 text-sm italic text-muted-foreground">
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
                    <div className="min-h-64 md:min-h-80">
                      <AttachmentTile
                        announcementId={a.id}
                        att={heroImage}
                        size="hero"
                        onDownload={() =>
                          void handleDownload(a, heroImage.id, heroImage.fileName)
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {bodyEmpty ? (
                      <p className="px-6 py-6 text-sm italic text-muted-foreground md:px-8">
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

                    {a.attachments.length > 0 ? (
                      <div className="px-6 pt-1 pb-8 md:px-8">
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
                              onDownload={() =>
                                void handleDownload(a, att.id, att.fileName)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ) : bodyEmpty ? (
                      <div className="h-2" />
                    ) : null}
                  </>
                )}
              </article>
            );
          })}

          {feedVisibleCount < visibleItems.length && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setFeedVisibleCount((c) => c + FEED_PAGE_STEP)}
                className="liquid-glass-btn liquid-glass-btn-subtle inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                Show {Math.min(FEED_PAGE_STEP, visibleItems.length - feedVisibleCount)} more
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {canCompose && (
        <ComposeAnnouncementDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          role={role}
          onCreated={() => void load()}
        />
      )}

      <EditAnnouncementDialog
        announcement={editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />

      <AnnouncementReaderDialog
        announcement={reading}
        onOpenChange={(o) => {
          if (!o) setReading(null);
        }}
        scopeLabel={scopeLabel}
        onDownload={(ann, attId, fileName) =>
          void handleDownload(ann, attId, fileName)
        }
      />
    </div>
  );
}
