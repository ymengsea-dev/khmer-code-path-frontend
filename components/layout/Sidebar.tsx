"use client";

import React from "react";
import {
  LayoutGrid,
  BookOpen,
  Search,
  Sparkles,
  ClipboardList,
  Notebook,
  Users,
  Building2,
  Wrench,
  Layers,
  CalendarCheck,
  GraduationCap,
  Globe,
  Shield,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppLogoMark } from "@/components/brand/AppLogo";
import { useSession } from "next-auth/react";
import type { ClassSummary } from "@/lib/types/class-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { classGradientDotColor } from "@/lib/class-display";

interface AppSidebarProps {
  activeNav: string;
  activeCourseId?: string | null;
  lessonClasses?: ClassSummary[];
  publicCoursesNavLabel?: string | null;
  rolesPermissionsNavLabel?: string | null;
  facultyManagementNavLabel?: string | null;
  onNavChange: (id: string, courseId?: string) => void;
  onOpenSearch?: () => void;
  className?: string;
}

export function Sidebar({
  activeNav,
  activeCourseId,
  lessonClasses = [],
  publicCoursesNavLabel,
  rolesPermissionsNavLabel,
  facultyManagementNavLabel,
  onNavChange,
  onOpenSearch,
  className,
}: AppSidebarProps) {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const roleRaw = (currentUser?.role ?? session?.user?.role ?? "student").toLowerCase();
  const appRole: "student" | "teacher" | "admin" =
    roleRaw === "admin" || roleRaw === "teacher" || roleRaw === "student"
      ? roleRaw
      : "student";
  const isAdmin = appRole === "admin";
  const showUserManagement = isAdmin || appRole === "teacher";
  const showDepartments = isAdmin;
  const showOperations = isAdmin;
  const showLearnerNav = !isAdmin;
  const isTeacher = appRole === "teacher";
  const isStudent = appRole === "student";
  const showPublicCourses = isStudent && Boolean(publicCoursesNavLabel);
  const showRolesPermissions = isAdmin && Boolean(rolesPermissionsNavLabel);
  const showFacultyManagement = isAdmin && Boolean(facultyManagementNavLabel);

  return (
    <SidebarRoot side="left" className={className}>
      
      <SidebarHeader className="px-3 pb-3 pt-3 relative border-b border-zinc-200/70 dark:border-white/8">
        <div className="relative flex w-full flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavChange("courses")}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left"
              aria-label="Go to dashboard"
            >
              <AppLogoMark className="h-14 w-[5.5rem]" />
              <span className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                AI-LMS
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            className="h-10 w-full rounded-xl px-3 flex items-center justify-between text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 bg-zinc-100/70 dark:bg-white/6 border border-zinc-200/80 dark:border-white/10"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 shrink-0" />
              <span className="font-medium text-sm">Search</span>
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 bg-white/80 dark:bg-white/8 border border-zinc-200/80 dark:border-white/10">
              <span>⌘</span><span>/</span>
            </span>
          </button>
        </div>
      </SidebarHeader>

      {/* Main Content Area */}
      <SidebarContent className="gap-4 px-2 py-2 select-none">
        
        {/* Section 1: Core Navigation (Flat list) */}
        <SidebarGroup className="space-y-0.5">
          <SidebarMenu className="gap-0.5">
            
            {/* Home Navigation */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "courses"}
                onClick={() => onNavChange("courses")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5",
                  activeNav === "courses"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {showFacultyManagement && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "faculty-management" || activeNav === "faculty-detail"}
                  onClick={() => onNavChange("faculty-management")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "faculty-management" || activeNav === "faculty-detail"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">{facultyManagementNavLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {showDepartments && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "departments"}
                  onClick={() => onNavChange("departments")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "departments"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Departments</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "classes" || activeNav === "class-detail"}
                onClick={() => onNavChange("classes")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                  activeNav === "classes" || activeNav === "class-detail"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">Classes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {showUserManagement && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "student-management"}
                  onClick={() => onNavChange("student-management")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "student-management"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Student Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {(isTeacher || isAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "attendance-management"}
                  onClick={() => onNavChange("attendance-management")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "attendance-management"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <CalendarCheck className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Attendance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {showRolesPermissions && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "roles-permissions"}
                  onClick={() => onNavChange("roles-permissions")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "roles-permissions"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">{rolesPermissionsNavLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {showOperations && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "operations"}
                  onClick={() => onNavChange("operations")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "operations"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Operations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {showPublicCourses && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "public-courses"}
                  onClick={() => onNavChange("public-courses")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "public-courses"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">{publicCoursesNavLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {showLearnerNav && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "tasks"}
                  onClick={() => onNavChange("tasks")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "tasks"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Quizzes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

          </SidebarMenu>
        </SidebarGroup>

        {/* Section 2: Workspace Navigation */}
        {showLearnerNav && (
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="px-2 h-6">
            <span className="text-xs font-bold text-zinc-500">Workspace</span>
          </SidebarGroupLabel>
          
          <SidebarMenu className="gap-0.5">

            {isTeacher && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "course-content"}
                  onClick={() => onNavChange("course-content")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "course-content"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Content Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* AI Chat Nav */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "ai-chat"}
                onClick={() => onNavChange("ai-chat")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                  activeNav === "ai-chat"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">AI Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Notebook Nav */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "notebook"}
                onClick={() => onNavChange("notebook")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                  activeNav === "notebook"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <Notebook className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left">Notebook</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarGroup>
        )}

        {/* Section 3: Classes List */}
        {showLearnerNav && (
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="px-2 h-6">
            <span className="text-xs font-bold text-zinc-500">Classes</span>
          </SidebarGroupLabel>
          
          <SidebarMenu className="gap-0.5">
            {lessonClasses.map((klass) => (
              <SidebarMenuItem key={klass.id}>
                <SidebarMenuButton
                  isActive={activeNav === "lessons" && activeCourseId === String(klass.id)}
                  onClick={() => onNavChange("lessons", String(klass.id))}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5",
                    activeNav === "lessons" && activeCourseId === String(klass.id)
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <span
                      className="size-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: classGradientDotColor(klass.cardGradient) }}
                      aria-hidden
                    />
                  </span>
                  <span className="flex-1 text-left truncate">{klass.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        )}

      </SidebarContent>

    </SidebarRoot>
  );
}
