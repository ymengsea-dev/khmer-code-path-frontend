"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { getValidAccessToken } from "@/lib/auth/client-session";
import {
  formatTimeAgo,
  notificationSection,
} from "@/lib/format-time-ago";
import { classService } from "@/lib/services/class-service";
import { notificationService } from "@/lib/services/notification-service";
import type {
  NotificationDto,
  NotificationType,
} from "@/lib/types/notification-api";

export const CLASSES_UPDATED_EVENT = "khmer-code-path:classes-updated";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type NotificationIconType =
  | "grade"
  | "attendance"
  | "question"
  | "lesson"
  | "invitation"
  | "system";

export interface NotificationItem {
  id: string;
  notificationType: NotificationType;
  icon: NotificationIconType;
  title: string;
  message: string;
  timeAgo: string;
  section: string;
  read: boolean;
  highlighted?: boolean;
  invitationId?: number;
  actionableInvitation: boolean;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  acceptInvitation: (notificationId: string, invitationId: number) => Promise<void>;
  declineInvitation: (notificationId: string, invitationId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function iconForType(type: NotificationType): NotificationIconType {
  switch (type) {
    case "GRADE_POSTED":
      return "grade";
    case "ATTENDANCE_RECORDED":
      return "attendance";
    case "CLASS_QUESTION":
      return "question";
    case "LESSON_PUBLISHED":
      return "lesson";
    case "CLASS_INVITATION":
      return "invitation";
    default:
      return "system";
  }
}

function mapDto(dto: NotificationDto): NotificationItem {
  const invitationId =
    dto.type === "CLASS_INVITATION" &&
    dto.resourceType === "class_invitation" &&
    dto.resourceId != null
      ? dto.resourceId
      : undefined;
  return {
    id: String(dto.id),
    notificationType: dto.type,
    icon: iconForType(dto.type),
    title: dto.title,
    message: dto.message ?? "",
    timeAgo: formatTimeAgo(dto.createdAt),
    section: notificationSection(dto.createdAt),
    read: dto.read,
    highlighted: !dto.read && dto.type === "GRADE_POSTED",
    invitationId,
    actionableInvitation:
      dto.type === "CLASS_INVITATION" && invitationId != null && !dto.read,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const data = await notificationService.list("all", 50, 0);
      setNotifications(data.items.map(mapDto));
      setUnreadCount(data.unreadCount);
    } catch {
      // keep existing state on transient errors
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const connect = async () => {
      const token = await getValidAccessToken();
      if (cancelled || !token) return;

      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      reconnectAttemptRef.current = 0;

      eventSource.addEventListener("notification", (event) => {
        try {
          const dto = JSON.parse((event as MessageEvent).data) as NotificationDto;
          const item = mapDto(dto);
          setNotifications((prev) => {
            const without = prev.filter((n) => n.id !== item.id);
            return [item, ...without];
          });
        } catch {
          // ignore malformed payloads
        }
      });

      eventSource.addEventListener("unread_count", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { count: number };
          setUnreadCount(payload.count);
        } catch {
          // ignore
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
        if (!cancelled) {
          const attempt = reconnectAttemptRef.current + 1;
          reconnectAttemptRef.current = attempt;
          const delayMs = Math.min(30_000, 2000 * 2 ** Math.min(attempt - 1, 4));
          reconnectTimer.current = setTimeout(() => void connect(), delayMs);
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [status]);

  const markRead = useCallback(async (id: string) => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return;
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read) wasUnread = true;
        return n.id === id ? { ...n, read: true, highlighted: false } : n;
      })
    );
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await notificationService.markRead(numericId);
    } catch {
      void refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, highlighted: false })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  const acceptInvitation = useCallback(
    async (notificationId: string, invitationId: number) => {
      await classService.acceptInvitation(invitationId);
      await notificationService.markRead(Number(notificationId));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, actionableInvitation: false, highlighted: false }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    },
    []
  );

  const declineInvitation = useCallback(
    async (notificationId: string, invitationId: number) => {
      await classService.declineInvitation(invitationId);
      await notificationService.markRead(Number(notificationId));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, actionableInvitation: false, highlighted: false }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    []
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      acceptInvitation,
      declineInvitation,
      refresh,
    }),
    [
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      acceptInvitation,
      declineInvitation,
      refresh,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
