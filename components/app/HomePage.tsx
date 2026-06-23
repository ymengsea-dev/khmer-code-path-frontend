"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseGrid } from "@/components/course/CourseGrid";
import { EmbeddedIDE } from "@/components/code/EmbeddedIDE";
import { MyLearning } from "@/components/learning/MyLearning";
import { MyTasksView } from "@/components/tasks/MyTasksView";
import { ProfileView } from "@/components/profile/ProfileView";
import { SettingsView } from "@/components/settings/SettingsView";
import { ClassesView } from "@/components/classes/ClassesView";
import { PublicCoursesView } from "@/components/classes/PublicCoursesView";
import { ClassDetailView } from "@/components/classes/ClassDetailView";
import { NotebookView } from "@/components/notebook/NotebookView";
import { LessonsView } from "@/components/lessons/LessonsView";
import { AiChatView } from "@/components/ai-chat/AiChatView";
import { StudentManagementView } from "@/components/users/StudentManagementView";
import { AttendanceManagementView } from "@/components/attendance/AttendanceManagementView";
import { DepartmentsView } from "@/components/departments/DepartmentsView";
import { OperationsView } from "@/components/operations/OperationsView";
import { FacultyManagementView } from "@/components/faculties/FacultyManagementView";
import { FacultyDetailView } from "@/components/faculties/FacultyDetailView";
import { PermissionsManagementView } from "@/components/permissions/PermissionsManagementView";
import { CourseContentView } from "@/components/course-content/CourseContentView";
import { classService } from "@/lib/services/class-service";
import { permissionService } from "@/lib/services/permission-service";
import { facultyService } from "@/lib/services/faculty-service";
import type { ClassSummary } from "@/lib/types/class-api";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey, parseView, type AppView } from "@/lib/navigation/app-query";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
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
import { CurrentUserAvatar } from "@/components/profile/CurrentUserAvatar";
import { BouncyPage } from "@/components/motion";
import { GlassPageTitle } from "@/components/ui/glass-field";
import { authService } from "@/lib/services/auth-service";

const ADMIN_BLOCKED_VIEWS: AppView[] = ["tasks", "code", "notebook", "learning"];

const VIEW_LABELS: Record<AppView, string> = {
  courses:        "Dashboard",
  classes:        "Classes",
  lessons:        "Class",
  tasks:          "Quizzes",
  notebook:       "Notebook",
  "ai-chat":      "AI Assistant",
  code:           "Code Sandbox",
  learning:       "My Learning",
  profile:        "Profile",
  settings:       "Settings",
  "student-management": "Student Management",
  "attendance-management": "Attendance Management",
  departments:    "Departments",
  operations:     "Operations",
  "faculty-management": "Faculty Management",
  "faculty-detail": "Faculty",
  "roles-permissions": "Roles & Permissions",
  "public-courses": "Public Courses",
  "course-content": "Content Management",
  "class-detail": "Class Details",
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
  const facultyParam = searchParams.get(QueryKey.faculty);
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
  const { displayName, role: appRole } = useUserProfile();
  const [lessonClasses, setLessonClasses] = useState<ClassSummary[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [classDetailTitle, setClassDetailTitle] = useState<string | null>(null);
  const [facultyDetailTitle, setFacultyDetailTitle] = useState<string | null>(null);
  const [publicCoursesNavLabel, setPublicCoursesNavLabel] = useState<string | null>(null);
  const [rolesPermissionsNavLabel, setRolesPermissionsNavLabel] = useState<string | null>(null);
  const [facultyManagementNavLabel, setFacultyManagementNavLabel] = useState<string | null>(null);
  const headerName = displayName || session?.user?.name?.trim() || null;

  useEffect(() => {
    if (activeNav !== "class-detail") setClassDetailTitle(null);
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== "faculty-detail") setFacultyDetailTitle(null);
  }, [activeNav]);

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
    if (appRole !== "admin") {
      setRolesPermissionsNavLabel(null);
      return;
    }
    let cancelled = false;
    permissionService
      .getConfig()
      .then((cfg) => {
        if (!cancelled) setRolesPermissionsNavLabel(cfg.pageTitle);
      })
      .catch(() => {
        if (!cancelled) setRolesPermissionsNavLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appRole]);

  useEffect(() => {
    if (appRole !== "admin") {
      setFacultyManagementNavLabel(null);
      return;
    }
    let cancelled = false;
    facultyService
      .getConfig()
      .then((cfg) => {
        if (!cancelled) setFacultyManagementNavLabel(cfg.pageTitle);
      })
      .catch(() => {
        if (!cancelled) setFacultyManagementNavLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appRole]);

  useEffect(() => {
    if (appRole !== "student") {
      setPublicCoursesNavLabel(null);
      return;
    }
    let cancelled = false;
    classService
      .getPublicCoursesConfig()
      .then((cfg) => {
        if (!cancelled) setPublicCoursesNavLabel(cfg.enabled ? cfg.navLabel : null);
      })
      .catch(() => {
        if (!cancelled) setPublicCoursesNavLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [appRole]);

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
      updates[QueryKey.faculty] = null;

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

  const handleViewClassDetail = useCallback(
    (payload: { classId: string }) => {
      setParams({
        [QueryKey.view]: "class-detail",
        [QueryKey.course]: payload.classId,
        [QueryKey.lesson]: null,
        [QueryKey.module]: null,
        [QueryKey.lessonId]: null,
        [QueryKey.tab]: null,
      });
    },
    [setParams],
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

  const handleBackToClasses = useCallback(() => {
    setParams({
      [QueryKey.view]: "classes",
      [QueryKey.course]: null,
      [QueryKey.lesson]: null,
      [QueryKey.module]: null,
      [QueryKey.lessonId]: null,
      [QueryKey.tab]: null,
    });
  }, [setParams]);

  const handleBackToClassDetail = useCallback(() => {
    if (!courseParam) return;
    setParams({
      [QueryKey.view]: "class-detail",
      [QueryKey.course]: courseParam,
      [QueryKey.lesson]: null,
      [QueryKey.module]: null,
      [QueryKey.lessonId]: null,
      [QueryKey.tab]: null,
    });
  }, [courseParam, setParams]);

  const handleBackToFaculties = useCallback(() => {
    setParams({
      [QueryKey.view]: "faculty-management",
      [QueryKey.faculty]: null,
    });
  }, [setParams]);

  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-transparent text-foreground font-sans">
        <Sidebar
          activeNav={
            activeNav === "class-detail"
              ? "classes"
              : activeNav === "faculty-detail"
                ? "faculty-management"
                : activeNav
          }
          activeCourseId={activeCourseId}
          lessonClasses={lessonClasses}
          publicCoursesNavLabel={publicCoursesNavLabel}
          rolesPermissionsNavLabel={rolesPermissionsNavLabel}
          facultyManagementNavLabel={facultyManagementNavLabel}
          onNavChange={handleNavChange}
          onOpenSearch={() => setCommandOpen(true)}
        />

        <SidebarInset>
          {/* Shared top header — Apple liquid glass floating pills */}
          <header className="shrink-0 flex items-center justify-between gap-3 px-5 pt-4 pb-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <SidebarTrigger />
            {activeNav === "lessons" ? (
              <GlassPageTitle className="gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 truncate leading-tight">
                  {lessonContext?.title ?? "Class"}
                </h1>
                {lessonContext?.module && (
                  <span className="text-xs text-zinc-500 shrink-0 hidden sm:block">
                    {lessonContext.module}
                  </span>
                )}
              </GlassPageTitle>
            ) : activeNav === "class-detail" ? (
              <GlassPageTitle>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 truncate leading-tight">
                  {classDetailTitle ?? "Class"}
                </h1>
              </GlassPageTitle>
            ) : activeNav === "faculty-detail" ? (
              <GlassPageTitle>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 truncate leading-tight">
                  {facultyDetailTitle ?? "Faculty"}
                </h1>
              </GlassPageTitle>
            ) : (
              <GlassPageTitle>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
                  {activeNav === "public-courses" && publicCoursesNavLabel
                    ? publicCoursesNavLabel
                    : activeNav === "roles-permissions" && rolesPermissionsNavLabel
                      ? rolesPermissionsNavLabel
                      : activeNav === "faculty-management" && facultyManagementNavLabel
                        ? facultyManagementNavLabel
                        : VIEW_LABELS[activeNav] ?? "Dashboard"}
                </h1>
              </GlassPageTitle>
            )}

            </div>

            {/* Right — action pills */}
            <div className="flex items-center gap-2.5">
              {/* Notification pill */}
              <NotificationBell className="topbar-pill h-10 px-3 rounded-full inline-flex items-center justify-center" />

              {/* Avatar + name pill */}
              <DropdownMenu>
                <DropdownMenuTrigger className="topbar-pill h-10 flex items-center gap-2.5 px-3 cursor-pointer outline-none">
                  <CurrentUserAvatar
                    className="w-7 h-7"
                    textClassName="text-[10px]"
                  />
                  {headerName && (
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 hidden sm:block pr-1">
                      {headerName}
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
          <BouncyPage key={activeNav} className="px-5 pt-3 pb-5">
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
                onBackToClasses={handleBackToClasses}
                onBackToClassDetail={handleBackToClassDetail}
              />
            )}
            {activeNav === "classes" && (
              <ClassesView onEnterClass={handleEnterClass} />
            )}
            {activeNav === "public-courses" && (
              <PublicCoursesView onEnterClass={handleEnterClass} />
            )}
            {activeNav === "class-detail" && (
              <ClassDetailView
                classId={activeCourseId}
                onBack={handleBackToClasses}
                onEnterClass={handleEnterClass}
                onClassNameLoaded={setClassDetailTitle}
              />
            )}
            {activeNav === "student-management" && <StudentManagementView />}
            {activeNav === "attendance-management" && <AttendanceManagementView />}
            {activeNav === "departments" && <DepartmentsView />}
            {activeNav === "operations" && <OperationsView />}
            {activeNav === "faculty-management" && <FacultyManagementView />}
            {activeNav === "faculty-detail" && (
              <FacultyDetailView
                facultyId={facultyParam}
                onBack={handleBackToFaculties}
                onFacultyNameLoaded={setFacultyDetailTitle}
              />
            )}
            {activeNav === "roles-permissions" && <PermissionsManagementView />}
            {activeNav === "course-content" && <CourseContentView />}
            {activeNav === "courses" && (
              <CourseGrid
                courses={courses}
                coursesLoading={coursesLoading}
                coursesError={coursesError}
                onSelect={() => {}}
                onEnterClass={handleEnterClass}
                onViewClassDetail={handleViewClassDetail}
                canManageCourses={false}
              />
            )}
          </BouncyPage>
        </SidebarInset>
        <GlobalCommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onNavigate={handleSearchNavigate}
        />
    </SidebarProvider>
  );
}
