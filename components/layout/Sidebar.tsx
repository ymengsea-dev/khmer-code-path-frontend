"use client";

import React from "react";
import {
  LayoutGrid,
  BookOpen,
  Code2,
  PanelLeftClose,
  Search,
  Bot,
  ClipboardList,
  Notebook,
  Plus,
  MoreHorizontal,
  Users,
  Building2,
  Wrench,
  Layers,
  GraduationCap,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { ClassSummary } from "@/lib/types/class-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface AppSidebarProps {
  activeNav: string;
  activeCourseId?: string | null;
  lessonClasses?: ClassSummary[];
  onNavChange: (id: string, courseId?: string) => void;
  onOpenSearch?: () => void;
  className?: string;
}

export function Sidebar({
  activeNav,
  activeCourseId,
  lessonClasses = [],
  onNavChange,
  onOpenSearch,
  className,
}: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
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

  return (
    <SidebarRoot side="left" className={cn("shrink-0", className)}>
      
      <SidebarHeader className={cn("px-4 pb-3 pt-3 relative", !open && "px-2")}>
        <div className={cn("relative flex flex-col gap-2.5 transition-all duration-300 w-full", !open && "items-center")}>
          <div className={cn("flex items-center justify-between gap-2", !open && "justify-center")}>
            <button
              type="button"
              onClick={() => (open ? onNavChange("courses") : setOpen(true))}
              className={cn(
                "flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-zinc-100/70 dark:hover:bg-white/7",
                !open && "justify-center px-0"
              )}
              aria-label={open ? "Go to dashboard" : "Expand sidebar"}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sm ring-1 ring-white/25 dark:ring-white/10">
                <svg viewBox="0 0 24 24" className="size-4 fill-white">
                  <path d="M12 2L2 22h20L12 2zm0 3.8L18.7 19H5.3L12 5.8z" />
                </svg>
              </span>
              {open ? (
                <span className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  AI-LMS
                </span>
              ) : null}
            </button>
            {open ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-1.5 rounded-lg hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/8 shrink-0"
                title="Minimize Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Clean Command/Search Bar */}
          {open ? (
            <button
              type="button"
              onClick={onOpenSearch}
              className="h-9 w-full rounded-xl bg-zinc-100/70 px-3 flex items-center justify-between text-sm text-zinc-600 hover:bg-zinc-100/90 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-200" />
                <span className="font-semibold">Search</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-bold bg-white/18 px-1.5 py-0.5 rounded-md border border-white/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] dark:bg-white/5 dark:border-white/10 dark:text-zinc-300">/</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSearch}
              className="size-9 rounded-xl bg-zinc-100/70 flex items-center justify-center text-sm text-zinc-600 hover:bg-zinc-100/90 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12 transition-all cursor-pointer"
            >
              <span className="font-bold text-[10px]">⌘</span>
            </button>
          )}
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
                {open && <span className="flex-1 text-left">Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {showUserManagement && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "users"}
                  onClick={() => onNavChange("users")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "users"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  {open && (
                    <span className="flex-1 text-left">User Management</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {isTeacher && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "gradebook"}
                  onClick={() => onNavChange("gradebook")}
                  className={cn(
                    "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                    activeNav === "gradebook"
                      ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  {open && <span className="flex-1 text-left">Gradebook</span>}
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
                  {open && (
                    <span className="flex-1 text-left">Departments</span>
                  )}
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
                  {open && (
                    <span className="flex-1 text-left">Operations</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Classes Nav */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "classes"}
                onClick={() => onNavChange("classes")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                  activeNav === "classes"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                {open && <span className="flex-1 text-left">Classes</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

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
                  <Bot className="w-4 h-4" />
                </span>
                {open && (
                  <span className="flex-1 text-left">AI Chat</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

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
                  {open && (
                    <>
                      <span className="flex-1 text-left">Quizzes</span>
                      <Plus className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground shrink-0" />
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

          </SidebarMenu>
        </SidebarGroup>

        {/* Section 2: Workspace Navigation */}
        {showLearnerNav && (
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className={cn("flex items-center justify-between group/label px-2 h-6", !open && "justify-center px-0")}>
            {open ? (
              <>
                    <span className="text-xs font-bold text-zinc-500">
                  Workspace
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-zinc-100/80 dark:hover:bg-white/7 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 hover:bg-zinc-100/80 dark:hover:bg-white/7 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <span className="h-px w-5 bg-white/50 dark:bg-white/12" />
            )}
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
                  {open && (
                    <span className="flex-1 text-left">Course Content</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Code Sandbox */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeNav === "code"}
                onClick={() => onNavChange("code")}
                className={cn(
                  "rounded-2xl px-3 py-2 transition-all duration-150 border border-transparent text-sm font-medium h-10.5 group",
                  activeNav === "code"
                    ? "bg-zinc-100/85 text-zinc-800 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/7 hover:text-zinc-900"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </span>
                {open && (
                  <>
                    <span className="flex-1 text-left">Code Sandbox</span>
                    <Plus className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground shrink-0" />
                  </>
                )}
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
                {open && (
                  <span className="flex-1 text-left">Notebook</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarGroup>
        )}

        {/* Section 3: Classes List */}
        {showLearnerNav && (
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className={cn("flex items-center justify-between group/label px-2 h-6", !open && "justify-center px-0")}>
            {open ? (
              <>
                    <span className="text-xs font-bold text-zinc-500">
                  Classes
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-zinc-100/80 dark:hover:bg-white/7 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 hover:bg-zinc-100/80 dark:hover:bg-white/7 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <span className="h-px w-5 bg-white/50 dark:bg-white/12" />
            )}
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
                      className={cn(
                        "size-2.5 rounded-sm shrink-0 shadow-xs bg-linear-to-br",
                        klass.cardGradient
                      )}
                    />
                  </span>
                  {open && (
                    <span className="flex-1 text-left truncate">{klass.name}</span>
                  )}
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
