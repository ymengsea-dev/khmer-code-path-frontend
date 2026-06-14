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
      // Cmd+/ (Mac) or Ctrl+/ (Windows/Linux) — toggle search
      if (event.key === "/" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
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
          {/* Shared top header — Apple liquid glass floating pills */}
          <header className="shrink-0 flex items-center justify-between gap-3 px-4 pt-4 pb-1">

            {/* Left — page title */}
            <h1 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 whitespace-nowrap px-1">
              {VIEW_LABELS[activeNav] ?? "Dashboard"}
            </h1>

            {/* Right — action pills */}
            <div className="flex items-center gap-2.5">
              {/* Notification pill */}
              <NotificationBell className="topbar-pill h-10 px-3 rounded-full inline-flex items-center justify-center" />

              {/* Avatar + name pill */}
              <DropdownMenu>
                <DropdownMenuTrigger className="topbar-pill h-10 flex items-center gap-2.5 px-3 cursor-pointer outline-none">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 ring-1 ring-zinc-300/70 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-white/15 shrink-0">
                    {initials}
                  </div>
                  {displayName && (
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 hidden sm:block pr-1">
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
