"use client";

import React, { useMemo, useState } from "react";
import {
  AlarmClock,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  MessageCircle,
  UserPlus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type NotificationIconType,
  type NotificationItem,
} from "@/components/notifications/notification-context";

function NotificationIcon({ type }: { type: NotificationIconType }) {
  const Icon =
    type === "grade"
      ? GraduationCap
      : type === "attendance"
        ? ClipboardCheck
        : type === "question"
          ? MessageCircle
          : type === "lesson"
            ? BookOpen
            : type === "invitation"
              ? UserPlus
              : AlarmClock;

  const tone =
    type === "grade"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
      : type === "invitation"
        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full",
        tone
      )}
    >
      <Icon className="size-5 stroke-[1.75]" />
    </div>
  );
}

function NotificationRow({
  item,
  onRead,
  onAcceptInvitation,
  onDeclineInvitation,
  acting,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
  onAcceptInvitation: (notificationId: string, invitationId: number) => void;
  onDeclineInvitation: (notificationId: string, invitationId: number) => void;
  acting: boolean;
}) {
  const isInvitation = item.actionableInvitation && item.invitationId != null;

  return (
    <div
      className={cn(
        "w-full text-left px-4 py-3.5 transition-colors",
        item.highlighted && "bg-emerald-50/60 dark:bg-emerald-950/20",
        isInvitation && "bg-indigo-50/40 dark:bg-indigo-950/20"
      )}
    >
      <button
        type="button"
        onClick={() => !isInvitation && void onRead(item.id)}
        className={cn("w-full text-left", isInvitation && "cursor-default")}
      >
        <div className="flex gap-3">
          <NotificationIcon type={item.icon} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {!item.read && (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-emerald-500" />
              )}
              <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    "text-sm font-semibold text-foreground leading-snug",
                    item.read && "font-medium text-foreground/90"
                  )}
                >
                  {item.title}
                </h4>
                <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                  {item.timeAgo}
                </span>
              </div>
            </div>
            <p
              className={cn(
                "text-[13px] leading-relaxed text-muted-foreground mt-1 pr-1",
                !item.read && "pl-4"
              )}
            >
              {item.message}
            </p>
          </div>
        </div>
      </button>

      {isInvitation && (
        <div className="flex gap-2 mt-3 pl-14">
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs font-bold flex-1 gap-1"
            disabled={acting}
            onClick={() =>
              void onAcceptInvitation(item.id, item.invitationId!)
            }
          >
            {acting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold flex-1 gap-1"
            disabled={acting}
            onClick={() =>
              void onDeclineInvitation(item.id, item.invitationId!)
            }
          >
            <X className="size-3.5" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationBell({ className }: { className?: string }) {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    acceptInvitation,
    declineInvitation,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  const sections = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of notifications) {
      const list = map.get(n.section) ?? [];
      list.push(n);
      map.set(n.section, list);
    }
    const order = ["Today", "Yesterday", "Earlier"];
    return order
      .filter((s) => map.has(s))
      .map((s) => [s, map.get(s)!] as const);
  }, [notifications]);

  const handleAccept = async (notificationId: string, invitationId: number) => {
    setActingId(notificationId);
    try {
      await acceptInvitation(notificationId, invitationId);
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (notificationId: string, invitationId: number) => {
    setActingId(notificationId);
    try {
      await declineInvitation(notificationId, invitationId);
    } finally {
      setActingId(null);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "relative inline-flex items-center justify-center rounded-md p-1.5 text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
            {badgeLabel}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,400px)] p-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 px-4 py-3.5">
          <h3 className="text-base font-bold text-foreground">Notifications</h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void markAllRead();
            }}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-40"
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </button>
        </div>

        <div className="max-h-[min(70vh,420px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : sections.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            sections.map(([section, items], sectionIdx) => (
              <div key={section}>
                <div className="bg-slate-100/90 dark:bg-zinc-900/80 px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {section}
                  </span>
                </div>
                <div>
                  {items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <NotificationRow
                        item={item}
                        onRead={markRead}
                        onAcceptInvitation={handleAccept}
                        onDeclineInvitation={handleDecline}
                        acting={actingId === item.id}
                      />
                      {idx < items.length - 1 && (
                        <div className="h-px bg-slate-100 dark:bg-zinc-800/80 mx-4" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {sectionIdx < sections.length - 1 && (
                  <div className="h-px bg-slate-200/80 dark:bg-zinc-800" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
