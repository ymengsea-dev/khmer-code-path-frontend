"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  GlassSearchInput,
  GlassSelect,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { attendanceService } from "@/lib/services/attendance-service";
import type {
  AttendanceManagementConfigDto,
  AttendanceRosterDto,
  AttendanceRosterRowDto,
} from "@/lib/types/attendance-api";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey, parseAttendanceMonth } from "@/lib/navigation/app-query";

function qualityBadgeClass(qualityId: string) {
  switch (qualityId) {
    case "excellent":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400";
    case "good":
      return "border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-400";
    case "fair":
      return "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-400";
    case "poor":
      return "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-400";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-muted-foreground";
  }
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card bouncy={false} className="p-4 border-slate-200/70 dark:border-zinc-800/80">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", accent)}>
        {value}
      </p>
    </Card>
  );
}

export function AttendanceManagementView() {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const classParam = get(QueryKey.attendanceClass);
  const monthParam = get(QueryKey.attendanceMonth);

  const [config, setConfig] = useState<AttendanceManagementConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    classParam ? Number(classParam) : null,
  );
  const [roster, setRoster] = useState<AttendanceRosterDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warningStudentId, setWarningStudentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const monthFilter = useMemo(
    () => parseAttendanceMonth(monthParam, config?.defaultMonthId),
    [monthParam, config?.defaultMonthId],
  );

  const monthFilterIds = useMemo(
    () => new Set((config?.monthFilters ?? []).map((filter) => filter.id)),
    [config?.monthFilters],
  );

  const resolvedMonthFilter = monthFilterIds.has(monthFilter)
    ? monthFilter
    : config?.defaultMonthId && monthFilterIds.has(config.defaultMonthId)
      ? config.defaultMonthId
      : config?.monthFilters?.[0]?.id ?? "all";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setConfigError(null);
      try {
        const data = await attendanceService.getManagementConfig(
          selectedClassId ?? undefined,
        );
        if (cancelled) return;
        setConfig(data);
        setSelectedClassId((current) => {
          if (current != null) return current;
          if (classParam) {
            const fromUrl = Number(classParam);
            if (Number.isFinite(fromUrl)) return fromUrl;
          }
          if (data.defaultClassId) {
            const defaultId = Number(data.defaultClassId);
            if (Number.isFinite(defaultId)) return defaultId;
          }
          const first = data.classFilters?.[0];
          if (first) {
            const firstId = Number(first.value);
            if (Number.isFinite(firstId)) return firstId;
          }
          return null;
        });
      } catch {
        if (!cancelled) {
          setConfigError("Could not load attendance configuration.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classParam, selectedClassId]);

  useEffect(() => {
    if (!config?.monthFilters?.length) return;
    if (monthParam && monthFilterIds.has(monthParam)) return;
    const next =
      config.defaultMonthId && monthFilterIds.has(config.defaultMonthId)
        ? config.defaultMonthId
        : config.monthFilters?.[0]?.id ?? "all";
    setParams({
      [QueryKey.attendanceMonth]: next === "all" ? null : next,
    });
  }, [config, monthParam, monthFilterIds, setParams]);

  const loadRoster = useCallback(async () => {
    if (!selectedClassId) {
      setRoster(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await attendanceService.getRoster({
        classId: selectedClassId,
        search: searchQuery,
        month: resolvedMonthFilter,
      });
      setRoster(data);
    } catch {
      setRoster(null);
      setLoadError("Could not load attendance roster for this class.");
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, searchQuery, resolvedMonthFilter]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const setClassFilter = useCallback(
    (classId: string) => {
      const id = Number(classId);
      setSelectedClassId(Number.isFinite(id) ? id : null);
      setParams({
        [QueryKey.attendanceClass]: classId || null,
        [QueryKey.attendanceMonth]: null,
      });
    },
    [setParams],
  );

  const setMonthFilter = useCallback(
    (month: string) => {
      setParams({
        [QueryKey.attendanceMonth]: month === "all" ? null : month,
      });
    },
    [setParams],
  );

  const handleWarningToggle = async (row: AttendanceRosterRowDto) => {
    if (!selectedClassId || !config?.canManageWarnings) return;
    setWarningStudentId(row.studentId);
    setLoadError(null);
    try {
      await attendanceService.setWarning(
        selectedClassId,
        row.studentId,
        !row.warned,
      );
      await loadRoster();
    } catch {
      setLoadError("Could not update attendance warning.");
    } finally {
      setWarningStudentId(null);
    }
  };

  const handleExport = async () => {
    if (!selectedClassId || !config?.canExport) return;
    setExporting(true);
    setLoadError(null);
    try {
      await attendanceService.downloadExcel({
        classId: selectedClassId,
        search: searchQuery,
        month: resolvedMonthFilter,
      });
    } catch {
      setLoadError("Could not export attendance to Excel.");
    } finally {
      setExporting(false);
    }
  };

  const selectedMonthLabel =
    (config?.monthFilters ?? []).find((filter) => filter.id === resolvedMonthFilter)
      ?.label ?? "All months";

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {config?.pageDescription && (
        <p className="shrink-0 text-sm text-muted-foreground -mt-1 mb-1">
          {config.pageDescription}
        </p>
      )}

      <div className="flex-1 overflow-y-auto pt-3 space-y-4">
        {configError && (
          <p className="text-sm text-destructive" role="alert">
            {configError}
          </p>
        )}

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <GlassSearchInput
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <GlassSelect
            className="w-full lg:w-auto lg:min-w-[180px]"
            value={selectedClassId ?? ""}
            disabled={!config?.classFilters.length}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            {(config?.classFilters ?? []).map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </GlassSelect>
          <GlassSelect
            className="w-full lg:w-auto lg:min-w-[180px]"
            value={resolvedMonthFilter}
            disabled={!(config?.monthFilters?.length)}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            {(config?.monthFilters ?? []).map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </GlassSelect>
          {config?.canExport && (
            <button
              type="button"
              disabled={!selectedClassId || exporting}
              className={cn(glassBtnPrimaryClass, "gap-2 text-xs h-10 px-4 shrink-0")}
              onClick={() => void handleExport()}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Excel
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Students" value={roster?.rows.length ?? 0} />
          <StatCard
            label="Class average"
            value={
              roster?.classAverageRate == null
                ? "—"
                : `${roster.classAverageRate.toFixed(1)}%`
            }
            accent="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label="Warned"
            value={roster?.warnedCount ?? 0}
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Month"
            value={selectedMonthLabel}
            accent="text-sm font-bold truncate"
          />
        </div>

        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (roster?.rows.length ?? 0) === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No students match this search.
          </p>
        ) : (
          <Card bouncy={false} className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left border-collapse text-[12px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Present</th>
                    <th className="px-5 py-3">Late</th>
                    <th className="px-5 py-3">Absent</th>
                    <th className="px-5 py-3">Rate</th>
                    <th className="px-5 py-3">Quality</th>
                    <th className="px-5 py-3">Warning</th>
                    {config?.canManageWarnings && (
                      <th className="px-5 py-3 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80">
                  {roster?.rows.map((row) => (
                    <tr
                      key={row.studentId}
                      className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            name={row.studentName}
                            avatarUrl={row.avatarUrl}
                            className="h-8 w-8"
                            textClassName="text-[10px]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {row.studentName}
                            </p>
                            {row.studentCode && (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {row.studentCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{row.present}</td>
                      <td className="px-5 py-3.5 tabular-nums">{row.late}</td>
                      <td className="px-5 py-3.5 tabular-nums">{row.absent}</td>
                      <td className="px-5 py-3.5 tabular-nums font-semibold">
                        {row.attendanceRate == null
                          ? "—"
                          : `${row.attendanceRate.toFixed(1)}%`}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            qualityBadgeClass(row.qualityId),
                          )}
                        >
                          {row.qualityLabel}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.warned ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-400 gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Warned
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            None
                          </span>
                        )}
                      </td>
                      {config?.canManageWarnings && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={warningStudentId === row.studentId}
                            className={cn(
                              row.warned
                                ? glassBtnSubtleClass
                                : glassBtnPrimaryClass,
                              "gap-1.5 text-xs h-9 px-3",
                            )}
                            onClick={() => void handleWarningToggle(row)}
                          >
                            {warningStudentId === row.studentId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : row.warned ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            {row.warned ? "Unwarn" : "Warn"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
