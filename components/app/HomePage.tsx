"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Course } from "@/types/course";
import { courseService } from "@/lib/services/course-service";
import { CourseFormDialog } from "@/components/course/CourseFormDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseGrid } from "@/components/course/CourseGrid";
import { CourseDetailPanel } from "@/components/course/CourseDetailPanel";
import { EmbeddedIDE } from "@/components/code/EmbeddedIDE";
import { MyLearning } from "@/components/learning/MyLearning";
import { MyTasksView } from "@/components/tasks/MyTasksView";
import { ProfileView } from "@/components/profile/ProfileView";
import { SettingsView } from "@/components/settings/SettingsView";
import { ClassesView } from "@/components/classes/ClassesView";
import { NotebookView } from "@/components/notebook/NotebookView";
import { LessonsView } from "@/components/lessons/LessonsView";
import { AiChatView } from "@/components/ai-chat/AiChatView";
import { UserManagementView } from "@/components/users/UserManagementView";
import { DepartmentsView } from "@/components/departments/DepartmentsView";
import { OperationsView } from "@/components/operations/OperationsView";
import { CourseContentView } from "@/components/course-content/CourseContentView";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey, parseView, type AppView } from "@/lib/navigation/app-query";
import { authService } from "@/lib/services/auth-service";
import type { UserProfile } from "@/lib/auth/backend-api";

const ADMIN_BLOCKED_VIEWS: AppView[] = ["tasks", "code", "notebook", "learning"];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

export function HomePage() {
  const { setParams, searchParams } = useQueryParams();
  useIsMobile();

  const viewParam = searchParams.get(QueryKey.view);
  const courseParam = searchParams.get(QueryKey.course);
  const lessonParam = searchParams.get(QueryKey.lesson);
  const moduleParam = searchParams.get(QueryKey.module);
  const detailId = searchParams.get(QueryKey.detail);

  useEffect(() => {
    if (!viewParam) {
      setParams({ [QueryKey.view]: "courses" });
    }
  }, [viewParam, setParams]);

  const activeNav = parseView(viewParam);
  const activeCourseId = courseParam;
  const lessonContext = useMemo(() => {
    if (!lessonParam) return null;
    return { title: lessonParam, module: moduleParam ?? "" };
  }, [lessonParam, moduleParam]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === detailId) ?? null,
    [detailId, courses]
  );
  const [sheetOpen, setSheetOpen] = useState(Boolean(detailId));
  const [appRole, setAppRole] = useState<"student" | "teacher" | "admin">("student");

  const canManageCourses = appRole === "admin" || appRole === "teacher";

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      setCourses(await courseService.listCourses({ size: 100 }));
    } catch {
      setCoursesError("Failed to load courses.");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    async function loadRole() {
      try {
        const response = await authService.me();
        const user = response?.data as UserProfile | undefined;
        const r = user?.role?.toLowerCase();
        if (r === "admin" || r === "teacher" || r === "student") {
          setAppRole(r);
        }
      } catch {
        /* keep default */
      }
    }
    void loadRole();
  }, []);

  useEffect(() => {
    if (appRole !== "admin" || !viewParam) return;
    const view = parseView(viewParam);
    if (!ADMIN_BLOCKED_VIEWS.includes(view)) return;
    setParams({
      [QueryKey.view]: "courses",
      [QueryKey.course]: null,
      [QueryKey.lesson]: null,
      [QueryKey.module]: null,
      [QueryKey.detail]: null,
      [QueryKey.tab]: null,
    });
  }, [appRole, viewParam, setParams]);

  useEffect(() => {
    if (detailId && selectedCourse) {
      setSheetOpen(true);
    } else if (!detailId) {
      setSheetOpen(false);
    }
  }, [detailId, selectedCourse]);

  const handleNavChange = useCallback(
    (id: string, courseId?: string) => {
      const view = parseView(id);
      const updates: Record<string, string | null> = {
        [QueryKey.view]: view,
      };

      if (courseId) {
        updates[QueryKey.course] = courseId;
        updates[QueryKey.lesson] = null;
        updates[QueryKey.module] = null;
      } else if (view === "courses") {
        updates[QueryKey.course] = null;
        updates[QueryKey.lesson] = null;
        updates[QueryKey.module] = null;
      } else if (view !== "lessons") {
        updates[QueryKey.lesson] = null;
        updates[QueryKey.module] = null;
      }

      if (view !== "courses") {
        updates[QueryKey.detail] = null;
      }

      setParams(updates);
    },
    [setParams]
  );

  const handleEnterClass = useCallback(
    (payload: { classId: string; title: string; module: string }) => {
      setParams({
        [QueryKey.view]: "lessons",
        [QueryKey.course]: payload.classId,
        [QueryKey.lesson]: payload.title,
        [QueryKey.module]: payload.module,
        [QueryKey.lessonId]: null,
        [QueryKey.tab]: null,
      });
    },
    [setParams, appRole]
  );

  const handleCourseSelect = useCallback(
    (course: Course) => {
      setParams({
        [QueryKey.view]: "courses",
        [QueryKey.detail]: String(course.id),
      });
      setSheetOpen(true);
    },
    [setParams]
  );

  const handleCloseDetail = useCallback(() => {
    setParams({ [QueryKey.detail]: null });
    setSheetOpen(false);
  }, [setParams]);

  useEffect(() => {
    if (viewParam && viewParam !== "courses" && detailId) {
      setParams({ [QueryKey.detail]: null });
    }
  }, [viewParam, detailId, setParams]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
        <Sidebar
          activeNav={activeNav}
          activeCourseId={activeCourseId}
          onNavChange={handleNavChange}
          className="shrink-0"
        />

        <SidebarInset>
          {activeNav === "code" && <EmbeddedIDE />}
          {activeNav === "learning" && <MyLearning />}
          {activeNav === "tasks" && <MyTasksView />}
          {activeNav === "profile" && <ProfileView />}
          {activeNav === "settings" && <SettingsView />}
          {activeNav === "notebook" && <NotebookView />}
          {activeNav === "ai-chat" && <AiChatView />}
          {activeNav === "lessons" && (
            <LessonsView
              classId={activeCourseId}
              lessonIdParam={searchParams.get(QueryKey.lessonId)}
              classTitle={lessonContext?.title}
              classModule={lessonContext?.module}
            />
          )}
          {activeNav === "classes" && (
            <ClassesView onEnterClass={handleEnterClass} />
          )}
          {activeNav === "users" && <UserManagementView />}
          {activeNav === "departments" && <DepartmentsView />}
          {activeNav === "operations" && <OperationsView />}
          {activeNav === "course-content" && <CourseContentView />}
          {activeNav === "courses" && (
            <CourseGrid
              courses={courses}
              coursesLoading={coursesLoading}
              coursesError={coursesError}
              selectedId={selectedCourse?.id}
              onSelect={handleCourseSelect}
              canManageCourses={canManageCourses}
              onCreateCourse={() => {
                setEditingCourse(null);
                setCourseFormOpen(true);
              }}
              onEditCourse={(course) => {
                setEditingCourse(course);
                setCourseFormOpen(true);
              }}
              onCoursesChanged={() => void loadCourses()}
            />
          )}
        </SidebarInset>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) handleCloseDetail();
        }}
      >
        <SheetContent
          side="right"
          className="p-3 pl-3 w-full sm:max-w-sm lg:max-w-md xl:max-w-[24rem] bg-transparent !border-0 border-l-0 data-[side=right]:!border-l-0 shadow-none rounded-l-2xl outline-none"
          showCloseButton={false}
        >
          {selectedCourse && (
            <CourseDetailPanel
              course={selectedCourse}
              onClose={handleCloseDetail}
              canManage={canManageCourses}
              onEdit={() => {
                setEditingCourse(selectedCourse);
                setCourseFormOpen(true);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <CourseFormDialog
        open={courseFormOpen}
        onOpenChange={setCourseFormOpen}
        course={editingCourse}
        onSaved={() => {
          void loadCourses();
          if (editingCourse && detailId === String(editingCourse.id)) {
            /* detail sheet will refresh from courses state */
          }
        }}
      />
    </SidebarProvider>
  );
}
