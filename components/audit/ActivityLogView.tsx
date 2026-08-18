"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassSearchInput, glassSelectClass } from "@/components/ui/glass-field";
import { auditService, type AuditLogEntry } from "@/lib/services/audit-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/** Mirrors AuditActions.java — grouped so the type filter reads as categories, not a flat action-code list. */
const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  { label: "Auth", actions: ["AUTH_LOGIN", "AUTH_LOGIN_FAILED", "AUTH_LOGOUT", "USER_REGISTER", "PASSWORD_RESET_REQUEST", "PASSWORD_RESET_CONFIRM"] },
  { label: "Classes", actions: ["CLASS_CREATE", "CLASS_UPDATE", "CLASS_DELETE"] },
  { label: "Departments", actions: ["DEPARTMENT_CREATE", "DEPARTMENT_UPDATE", "DEPARTMENT_DELETE"] },
  { label: "Faculties", actions: ["FACULTY_CREATE", "FACULTY_UPDATE", "FACULTY_DELETE"] },
  { label: "Attendance", actions: ["ATTENDANCE_RECORD", "ATTENDANCE_UPDATE"] },
  { label: "Exams", actions: ["EXAM_CREATE", "EXAM_SUBMIT", "EXAM_DELETE"] },
  { label: "Grades", actions: ["GRADE_RECORD", "GRADE_UPDATE"] },
  { label: "Permissions", actions: ["PERMISSION_UPDATE", "SCHOOL_FEATURES_UPDATE"] },
];

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function actionTone(action: string): string {
  const a = action.toUpperCase();
  if (a.includes("FAIL") || a.includes("DELETE") || a.includes("REVOKE")) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-300";
  }
  if (a.includes("LOGIN") || a.includes("CREATE") || a.includes("REGISTER")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  }
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("RESET")) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
}

function fullTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function ActivityLogView() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const load = useCallback(async (pageNum: number, action: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.list({
        page: pageNum,
        size: PAGE_SIZE,
        action: action || undefined,
      });
      setEntries(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load the activity log."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, actionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.action, e.actorEmail, e.actorId, e.targetType, e.targetId, e.detail, e.ipAddress]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [entries, query]);

  // Windowed page numbers around the current page (max 5 buttons).
  const pageWindow = useMemo(() => {
    const maxButtons = 5;
    const end = Math.min(totalPages, Math.max(page - 2, 0) + maxButtons);
    const start = Math.max(0, end - maxButtons);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [page, totalPages]);

  const rangeFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeTo = page * PAGE_SIZE + entries.length;

  const pagerBtnBase =
    "liquid-glass-btn liquid-glass-btn-subtle flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-semibold text-muted-foreground transition disabled:pointer-events-none disabled:opacity-40";

  const renderPageButton = (n: number) => (
    <button
      key={n}
      type="button"
      disabled={loading}
      onClick={() => void load(n, actionFilter)}
      aria-current={n === page ? "page" : undefined}
      className={cn(
        pagerBtnBase,
        n === page && "glass-btn-primary text-white",
      )}
    >
      {n + 1}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
          <GlassSearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter this page…"
          />
          <select
            className={cn(glassSelectClass, "sm:w-44")}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by activity type"
          >
            <option value="">All types</option>
            {ACTION_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.actions.map((action) => (
                  <option key={action} value={action}>
                    {actionLabel(action)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          {totalElements.toLocaleString()} {totalElements === 1 ? "event" : "events"}
        </p>
      </div>

      {error && (
        <p className="shrink-0 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      <Card bouncy={false} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <ScrollText className="h-6 w-6 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {query || actionFilter ? "No matching events" : "No activity yet"}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="h-full w-full min-w-[720px] table-fixed border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm dark:bg-zinc-900/85">
                <tr className="border-b border-black/5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:border-white/8">
                  <th className="w-[14%] px-4 py-2.5 font-bold">When</th>
                  <th className="w-[20%] px-4 py-2.5 font-bold">Actor</th>
                  <th className="w-[15%] px-4 py-2.5 font-bold">Action</th>
                  <th className="w-[16%] px-4 py-2.5 font-bold">Target</th>
                  <th className="w-[25%] px-4 py-2.5 font-bold">Detail</th>
                  <th className="w-[10%] px-4 py-2.5 font-bold">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedEntry(e)}
                    className="cursor-pointer border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015] dark:border-white/5 dark:hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground" title={fullTime(e.createdAt)}>
                      {formatTimeAgo(e.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                          {e.actorName || e.actorEmail || e.actorId || "System"}
                        </span>
                        {e.actorName && e.actorEmail && (
                          <span className="truncate text-[11px] text-muted-foreground">
                            {e.actorEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold",
                          actionTone(e.action),
                        )}
                      >
                        {e.action}
                      </span>
                    </td>
                    <td className="truncate px-4 py-3 text-muted-foreground">
                      {e.targetType ? (
                        <span>
                          {e.targetType}
                          {e.targetId ? (
                            <span className="text-zinc-400"> #{e.targetId}</span>
                          ) : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="truncate px-4 py-3 text-muted-foreground" title={e.detail ?? ""}>
                      {e.detail || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {e.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {rangeFrom.toLocaleString()}–{rangeTo.toLocaleString()} of{" "}
            {totalElements.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={pagerBtnBase}
              disabled={loading || page <= 0}
              onClick={() => void load(page - 1, actionFilter)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageWindow[0] > 0 && (
              <>
                {renderPageButton(0)}
                {pageWindow[0] > 1 && (
                  <span className="px-1 text-sm text-muted-foreground">…</span>
                )}
              </>
            )}

            {pageWindow.map(renderPageButton)}

            {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
              <>
                {pageWindow[pageWindow.length - 1] < totalPages - 2 && (
                  <span className="px-1 text-sm text-muted-foreground">…</span>
                )}
                {renderPageButton(totalPages - 1)}
              </>
            )}

            <button
              type="button"
              className={pagerBtnBase}
              disabled={loading || page >= totalPages - 1}
              onClick={() => void load(page + 1, actionFilter)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity detail</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <dl className="grid grid-cols-3 gap-x-3 gap-y-3 text-sm">
              <dt className="col-span-1 font-semibold text-muted-foreground">Action</dt>
              <dd className="col-span-2">
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    actionTone(selectedEntry.action),
                  )}
                >
                  {selectedEntry.action}
                </span>
              </dd>

              <dt className="col-span-1 font-semibold text-muted-foreground">When</dt>
              <dd className="col-span-2">{fullTime(selectedEntry.createdAt)}</dd>

              <dt className="col-span-1 font-semibold text-muted-foreground">Actor</dt>
              <dd className="col-span-2 wrap-break-word">
                {selectedEntry.actorName || "System"}
                {selectedEntry.actorEmail && (
                  <span className="block text-xs text-muted-foreground">
                    {selectedEntry.actorEmail}
                  </span>
                )}
                {selectedEntry.actorId && (
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {selectedEntry.actorId}
                  </span>
                )}
              </dd>

              <dt className="col-span-1 font-semibold text-muted-foreground">Target</dt>
              <dd className="col-span-2 wrap-break-word">
                {selectedEntry.targetType ? (
                  <>
                    {selectedEntry.targetType}
                    {selectedEntry.targetId ? ` #${selectedEntry.targetId}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </dd>

              <dt className="col-span-1 font-semibold text-muted-foreground">IP address</dt>
              <dd className="col-span-2 font-mono text-[12px]">
                {selectedEntry.ipAddress || "—"}
              </dd>

              <dt className="col-span-1 font-semibold text-muted-foreground">Detail</dt>
              <dd className="col-span-2 whitespace-pre-wrap wrap-break-word">
                {selectedEntry.detail || "—"}
              </dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
