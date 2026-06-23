"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classService } from "@/lib/services/class-service";
import type { ClassConfigDto, ClassSummary, GradingWeightsDto } from "@/lib/types/class-api";
import {
  parseSemesterFilter,
  resolveSemesterSelection,
  semesterToParam,
} from "@/lib/class-display";
import { CreateClassDialog } from "./CreateClassDialog";
import { ClassPreviewSheet } from "./ClassPreviewSheet";
import { ClassCard } from "./ClassCard";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { CLASSES_UPDATED_EVENT } from "@/components/notifications/notification-context";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { GlassSearchInput, GlassSelect } from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion";

type UserRole = "student" | "teacher" | "admin";

interface DisplayClass {
  summary: ClassSummary;
  iconBg: string;
  description: string;
  statusLabel: string;
  semesterLabel: string;
  gradingWeights: GradingWeightsDto | null;
}

interface ClassesViewProps {
  onEnterClass?: (payload: {
    classId: string;
    title: string;
    module: string;
  }) => void;
}

export function ClassesView({ onEnterClass }: ClassesViewProps) {
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const [classConfig, setClassConfig] = useState<ClassConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const selectedSemester = classConfig
    ? resolveSemesterSelection(get(QueryKey.semester), classConfig.allSemestersLabel)
    : "";

  const setSelectedSemester = useCallback(
    (label: string) => {
      if (!classConfig) return;
      setParams({
        [QueryKey.semester]: semesterToParam(label, classConfig.allSemestersLabel),
      });
    },
    [setParams, classConfig]
  );

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role = (currentUser?.role?.toLowerCase() as UserRole) ?? "student";
  const [classes, setClasses] = useState<DisplayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [previewClass, setPreviewClass] = useState<DisplayClass | null>(null);

  const teacherUserId =
    role === "teacher" && currentUser?.userId ? currentUser.userId : null;

  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isStudent = role === "student";
  const canCreateClass = isTeacher || isAdmin;
  const canManageClass = isTeacher || isAdmin;

  const openClassDetail = (classId: number) => {
    setParams({
      [QueryKey.view]: "class-detail",
      [QueryKey.course]: String(classId),
      [QueryKey.tab]: null,
    });
  };

  const openClass = (displayClass: DisplayClass) => {
    if (canManageClass) {
      openClassDetail(displayClass.summary.id);
    } else {
      setPreviewClass(displayClass);
    }
  };

  useEffect(() => {
    let cancelled = false;
    classService
      .getClassConfig()
      .then((config) => {
        if (!cancelled) {
          setClassConfig(config);
          setConfigError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClassConfig(null);
          setConfigError("Could not load class options. Please refresh the page.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadClasses = useCallback(async () => {
    if (!classConfig) return;
    setLoading(true);
    setLoadError(null);
    try {
      const semesterFilter = parseSemesterFilter(
        selectedSemester,
        classConfig.semesterFilters
      );
      const page = await classService.listClasses({
        search: searchQuery.trim() || undefined,
        semester: semesterFilter.semester,
        academicYear: semesterFilter.academicYear,
        size: 50,
      });

      const items = page.items ?? [];
      const withMeta: DisplayClass[] = await Promise.all(
        items.map(async (summary) => {
          let description = "";
          let gradingWeights: GradingWeightsDto | null = null;
          try {
            const detail = await classService.getClass(summary.id);
            description = detail.description?.trim() ?? "";
            gradingWeights = detail.gradingWeights ?? null;
          } catch {
            description = "";
            gradingWeights = null;
          }
          const semesterLabel = summary.semesterLabel?.trim() || "—";
          return {
            summary,
            iconBg: summary.cardGradient,
            description:
              description ||
              semesterLabel ||
              "Open this class to view lessons and materials.",
            statusLabel: summary.statusLabel,
            semesterLabel,
            gradingWeights,
          };
        })
      );

      setClasses(withMeta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 403
          ? "You do not have permission to view these classes."
          : "Could not load classes. Please try again.";
      setLoadError(message);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSemester, classConfig]);

  useEffect(() => {
    if (userLoading || !classConfig) return;
    void loadClasses();
  }, [userLoading, classConfig, loadClasses]);

  useEffect(() => {
    const onClassesUpdated = () => void loadClasses();
    window.addEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
    return () => window.removeEventListener(CLASSES_UPDATED_EVENT, onClassesUpdated);
  }, [loadClasses]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {canCreateClass && (
        <div className="pt-3 shrink-0 flex justify-end">
          <Button
            size="sm"
            className="gap-1.5 font-bold h-8.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Class
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-3 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <GlassSearchInput
            placeholder="Search classes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <GlassSelect
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={!classConfig}
            className="w-full sm:w-auto"
          >
            {(classConfig?.semesterFilters ?? []).map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </GlassSelect>
        </div>

        {configError && (
          <p className="text-xs text-rose-600 font-medium">{configError}</p>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && loadError && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void loadClasses()}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !loadError && classes.length > 0 && (
          <BouncyStagger className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((displayClass) => (
              <BouncyStaggerItem key={displayClass.summary.id} enter="simple">
                <ClassCard
                  summary={displayClass.summary}
                  semesterLabel={displayClass.semesterLabel}
                  gradient={displayClass.iconBg}
                  studentsLabel="Students"
                  onOpen={() => openClass(displayClass)}
                />
              </BouncyStaggerItem>
            ))}
          </BouncyStagger>
        )}

        {!loading && !loadError && classes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--glass-bg-subtle)",
                  backdropFilter: "blur(16px) saturate(1.5)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">No Classes Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {isStudent
                  ? "You have no classes yet. Accept an invitation from your teacher in the notification bell."
                  : canCreateClass
                    ? "Create a class to get started."
                    : "No classes matched your filters."}
              </p>
            </div>
          )}
      </div>

      <CreateClassDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isAdmin={isAdmin}
        currentTeacherId={teacherUserId ?? undefined}
        classConfig={classConfig}
        onCreated={() => void loadClasses()}
      />

      {isStudent && (
        <ClassPreviewSheet
          open={previewClass !== null}
          onOpenChange={(open) => !open && setPreviewClass(null)}
          classSummary={previewClass?.summary ?? null}
          description={previewClass?.description ?? ""}
          semesterLabel={previewClass?.semesterLabel ?? ""}
          statusLabel={previewClass?.statusLabel ?? "Active"}
          gradingWeights={
            previewClass?.gradingWeights ??
            classConfig?.gradingWeights ??
            null
          }
          scoreComponents={classConfig?.scoreComponents ?? []}
          onEnterClass={() => {
            if (!previewClass) return;
            onEnterClass?.({
              classId: String(previewClass.summary.id),
              title: previewClass.summary.name,
              module: previewClass.semesterLabel,
            });
            setPreviewClass(null);
          }}
        />
      )}
    </div>
  );
}
