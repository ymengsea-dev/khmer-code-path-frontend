"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, Loader2 } from "lucide-react";
import { classService } from "@/lib/services/class-service";
import type { PublicCourseSummary, PublicCoursesConfigDto } from "@/lib/types/class-api";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { QueryKey } from "@/lib/navigation/app-query";
import { CLASSES_UPDATED_EVENT } from "@/components/notifications/notification-context";
import { GlassSearchInput } from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion";
import { PublicCourseCard } from "./PublicCourseCard";

interface PublicCoursesViewProps {
  onEnterClass?: (payload: { classId: string; title: string; module: string }) => void;
}

export function PublicCoursesView({ onEnterClass }: PublicCoursesViewProps) {
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const [config, setConfig] = useState<PublicCoursesConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [courses, setCourses] = useState<PublicCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    classService
      .getPublicCoursesConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfigError("Could not load page configuration.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const publicCoursesEnabled = config?.enabled ?? false;

  const loadCourses = useCallback(async () => {
    if (!publicCoursesEnabled) {
      setCourses([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const page = await classService.listPublicCourses({
        search: searchQuery.trim() || undefined,
        size: 50,
      });
      setCourses(page.items ?? []);
    } catch {
      setLoadError("Could not load public courses.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, publicCoursesEnabled]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const handler = () => void loadCourses();
    window.addEventListener(CLASSES_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CLASSES_UPDATED_EVENT, handler);
  }, [loadCourses]);

  const handleSelfEnroll = async (course: PublicCourseSummary) => {
    if (course.enrolled) {
      onEnterClass?.({
        classId: String(course.id),
        title: course.name,
        module: course.semesterLabel,
      });
      return;
    }
    setEnrollingId(course.id);
    setActionError(null);
    try {
      await classService.selfEnroll(course.id);
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
      await loadCourses();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Could not join this class.";
        setActionError(message);
      } else {
        setActionError("Could not join this class.");
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const emptyMessage =
    config?.emptyMessage ?? "No public courses are available right now.";
  const enrollLabel = config?.enrollButtonLabel ?? "Join class";
  const enrolledLabel = config?.enrolledLabel ?? "Enrolled";
  const searchPlaceholder = config?.searchPlaceholder ?? "Search public courses…";

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {configError && (
        <p className="text-sm text-destructive">{configError}</p>
      )}

      {config && !publicCoursesEnabled && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground max-w-md">{emptyMessage}</p>
        </div>
      )}

      {publicCoursesEnabled && (
        <>
          <div className="shrink-0">
            <GlassSearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>

          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive py-8">{loadError}</p>
          ) : courses.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center gap-3">
              <BookOpen className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground max-w-md">{emptyMessage}</p>
            </div>
          ) : (
            <BouncyStagger className="grid flex-1 min-h-0 items-start gap-5 overflow-y-auto pb-4 scrollbar-hide sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <BouncyStaggerItem key={course.id} enter="simple">
                  <PublicCourseCard
                    course={course}
                    enrolledLabel={enrolledLabel}
                    enrollLabel={enrollLabel}
                    openLabel="Open class"
                    studentsLabel="Students"
                    isLoading={enrollingId === course.id}
                    onAction={() => void handleSelfEnroll(course)}
                  />
                </BouncyStaggerItem>
              ))}
            </BouncyStagger>
          )}
        </>
      )}
    </div>
  );
}
