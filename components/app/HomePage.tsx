"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseGrid } from "@/components/course/CourseGrid";
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
import { TeacherGradebookView } from "@/components/gradebook/TeacherGradebookView";
import { DepartmentsView } from "@/components/departments/DepartmentsView";
import { OperationsView } from "@/components/operations/OperationsView";
import { CourseContentView } from "@/components/course-content/CourseContentView";
import { classService } from "@/lib/services/class-service";
import type { ClassSummary } from "@/lib/types/class-api";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey, parseView, type AppView } from "@/lib/navigation/app-query";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useCoursesQuery } from "@/lib/hooks/use-courses-query";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalCommandPalette } from "@/components/search/GlobalCommandPalette";
import type { GlobalSearchResultDto } from "@/lib/types/search-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { getUserInitials } from "@/lib/auth/user-display";
import { authService } from "@/lib/services/auth-service";

const ADMIN_BLOCKED_VIEWS: AppView[] = ["tasks", "code", "notebook", "learning"];

const VIEW_LABELS: Record<AppView, string> = {
  courses:        "Dashboard",
  classes:        "Classes",
  lessons:        "Class Detail",
  tasks:          "Quizzes",
  notebook:       "Notebook",
  "ai-chat":      "AI Assistant",
  code:           "Code Sandbox",
  learning:       "My Learning",
  profile:        "Profile",
  settings:       "Settings",
  users:          "User Management",
  gradebook:      "Gradebook",
  departments:    "Departments",
  operations:     "Operations",
  "course-content": "Course Content",
};

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
  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesIsError,
  } = useCoursesQuery();
  const coursesError = coursesIsError ? "Failed to load courses." : null;
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const [lessonClasses, setLessonClasses] = useState<ClassSummary[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const appRole = (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ?? "student";
  const displayName =
    currentUser?.userName?.trim() || session?.user?.name?.trim() || null;
  const initials = getUserInitials(displayName || session?.user?.email || "?");

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
    let cancelled = false;
    classService
      .listClasses({ size: 100 })
      .then((page) => {
        if (!cancelled) setLessonClasses(page.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setLessonClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [appRole]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const isTypingOutsideSearch =
          !commandOpen &&
          (target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.isContentEditable);
        if (isTypingOutsideSearch) return;

        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen]);

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
      } else if (view === "classes") {
        updates[QueryKey.course] = null;
        updates[QueryKey.lesson] = null;
        updates[QueryKey.module] = null;
      } else if (view !== "lessons") {
        updates[QueryKey.lesson] = null;
        updates[QueryKey.module] = null;
      }

      updates[QueryKey.detail] = null;

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

  const handleSearchNavigate = useCallback(
    (result: GlobalSearchResultDto) => {
      const updates: Record<string, string | null> = {
        [QueryKey.view]: result.targetView,
        [QueryKey.detail]: null,
      };
      Object.entries(result.targetParams ?? {}).forEach(([key, value]) => {
        updates[key] = value;
      });
      setParams(updates);
    },
    [setParams]
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-transparent text-foreground overflow-hidden font-sans">
        <Sidebar
          activeNav={activeNav}
          activeCourseId={activeCourseId}
          lessonClasses={lessonClasses}
          onNavChange={handleNavChange}
          onOpenSearch={() => setCommandOpen(true)}
          className="shrink-0"
        />

        <SidebarInset>
          {/* Shared top header — persists across all views */}
          <header className="shrink-0 m-3 mb-0 rounded-2xl px-6 py-4 liquid-glass flex items-center justify-between gap-4">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              {VIEW_LABELS[activeNav] ?? "Dashboard"}
            </h1>
            <div className="flex items-center gap-2">
              <NotificationBell />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer outline-none rounded-full flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-white to-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-800 shadow-sm ring-1 ring-zinc-200/70 dark:from-zinc-100 dark:to-zinc-300 dark:ring-white/15 transition-all shrink-0">
                    {initials}
                  </div>
                  {displayName && (
                    <span className="text-sm font-semibold text-foreground hidden sm:block">
                      {displayName}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-48 p-1">
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    onClick={() => handleNavChange("profile")}
                  >
                    <UserIcon className="w-3.5 h-3.5 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    onClick={() => handleNavChange("settings")}
                  >
                    <Settings className="w-3.5 h-3.5 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
                    onClick={() => void authService.logout()}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* View area fills remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-3">
            {activeNav === "code" && <EmbeddedIDE />}
            {activeNav === "learning" && <MyLearning onEnterClass={handleEnterClass} />}
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
                onBackToClasses={() =>
                  setParams({
                    [QueryKey.view]: "classes",
                    [QueryKey.course]: null,
                    [QueryKey.lesson]: null,
                    [QueryKey.module]: null,
                    [QueryKey.lessonId]: null,
                    [QueryKey.tab]: null,
                  })
                }
              />
            )}
            {activeNav === "classes" && (
              <ClassesView onEnterClass={handleEnterClass} />
            )}
            {activeNav === "users" && <UserManagementView />}
            {activeNav === "gradebook" && <TeacherGradebookView />}
            {activeNav === "departments" && <DepartmentsView />}
            {activeNav === "operations" && <OperationsView />}
            {activeNav === "course-content" && <CourseContentView />}
            {activeNav === "courses" && (
              <CourseGrid
                courses={courses}
                coursesLoading={coursesLoading}
                coursesError={coursesError}
                onSelect={() => {}}
                onEnterClass={handleEnterClass}
                canManageCourses={false}
              />
            )}
          </div>
        </SidebarInset>
        <GlobalCommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onNavigate={handleSearchNavigate}
        />
      </div>
    </SidebarProvider>
  );
}
