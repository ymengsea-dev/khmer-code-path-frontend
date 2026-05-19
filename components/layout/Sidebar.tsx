"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  User as UserIcon,
  BookOpen,
  ChevronRight,
  Sparkles,
  Code2,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings,
  Search,
  Bell,
  Bot,
  ClipboardList,
  Notebook,
  Plus,
  MoreHorizontal,
  Users,
  Building2,
  Wrench,
  Layers,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { authService } from "@/lib/services/auth-service";
import type { UserProfile } from "@/lib/auth/backend-api";
import { getRoleLabel, getUserInitials } from "@/lib/auth/user-display";
import { sidebarCourses } from "@/data/sidebar-courses";

interface AppSidebarProps {
  activeNav: string;
  activeCourseId?: string | null;
  onNavChange: (id: string, courseId?: string) => void;
  className?: string;
}

export function Sidebar({ activeNav, activeCourseId, onNavChange, className }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState(session?.user?.name ?? "");
  const [roleLabel, setRoleLabel] = useState(
    getRoleLabel(session?.user?.role)
  );
  const [appRole, setAppRole] = useState<"student" | "teacher" | "admin">(
    "student"
  );
  const isAdmin = appRole === "admin";
  const showUserManagement = isAdmin || appRole === "teacher";
  const showDepartments = isAdmin;
  const showOperations = isAdmin;
  const showLearnerNav = !isAdmin;
  const isTeacher = appRole === "teacher";

  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
    if (session?.user?.role) {
      setRoleLabel(getRoleLabel(session.user.role));
      const r = session.user.role.toLowerCase();
      if (r === "admin" || r === "teacher" || r === "student") {
        setAppRole(r);
      }
    }
  }, [session?.user?.name, session?.user?.role]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await authService.me();
        const user = response?.data as UserProfile | undefined;
        if (user?.userName?.trim()) {
          setDisplayName(user.userName.trim());
        }
        if (user?.role) {
          setRoleLabel(getRoleLabel(user.role));
          const r = user.role.toLowerCase();
          if (r === "admin" || r === "teacher" || r === "student") {
            setAppRole(r);
          }
        }
      } catch {
        /* keep session fallbacks */
      }
    }
    void fetchUser();
  }, []);

  const initials = getUserInitials(displayName || session?.user?.email || "?");

  const handleLogout = () => {
    void authService.logout();
  };

  return (
    <SidebarRoot side="left" className={cn("shrink-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-zinc-950/90", className)}>
      
      {/* Header with App Logo & Collapse Button */}
      <SidebarHeader className={cn("pb-3 pt-2 relative", !open && "px-2")}>
        <div className={cn("relative flex flex-col gap-3 transition-all duration-300 w-full", !open && "items-center")}>
          <div className="flex items-center justify-between text-sidebar-foreground w-full min-w-0 pr-8">
            
            {/* Logo — navigates to dashboard */}
            <button
              type="button"
              onClick={() => onNavChange("courses")}
              className="flex items-center gap-2.5 min-w-0 hover:bg-slate-200/50 dark:hover:bg-zinc-900/50 p-1.5 rounded-lg transition-colors cursor-pointer text-left outline-none"
              aria-label="Go to dashboard"
            >
              <div className="relative shrink-0">
                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm ring-1 ring-white/20 dark:ring-white/10">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                    <path d="M12 2L2 22h20L12 2zm0 3.8L18.7 19H5.3L12 5.8z" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500 ring-1.5 ring-slate-50 dark:ring-zinc-950" />
              </div>
              {open && (
                <span className="font-bold text-[14px] tracking-tight text-foreground truncate block">
                  AI-LMS™
                </span>
              )}
            </button>
          </div>

          {/* Toggle Sidebar Collapse (Absolute positioned for perfection) */}
          {open ? (
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-1.5 right-0 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-900/50 shrink-0"
              title="Minimize Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-900/50 flex justify-center w-full mt-1"
              title="Expand Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Clean Command/Search Bar */}
          {open ? (
            <div className="w-full h-8 px-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-muted-foreground hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm">
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground/75" />
                <span className="font-medium text-[11px]">Command</span>
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-semibold bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-zinc-700/50 shadow-2xs">/</span>
            </div>
          ) : (
            <div className="size-8 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center text-xs text-muted-foreground hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm">
              <span className="font-bold text-[10px]">⌘</span>
            </div>
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
                  "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5",
                  activeNav === "courses"
                    ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                    activeNav === "users"
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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

            {showDepartments && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "departments"}
                  onClick={() => onNavChange("departments")}
                  className={cn(
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                    activeNav === "departments"
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                    activeNav === "operations"
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                  "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                  activeNav === "classes"
                    ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                  "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                  activeNav === "ai-chat"
                    ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                    activeNav === "tasks"
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Workspace
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                  <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground/60 hover:text-foreground">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground/60 hover:text-foreground">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <span className="h-px w-5 bg-slate-300 dark:bg-zinc-800" />
            )}
          </SidebarGroupLabel>
          
          <SidebarMenu className="gap-0.5">

            {isTeacher && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNav === "course-content"}
                  onClick={() => onNavChange("course-content")}
                  className={cn(
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                    activeNav === "course-content"
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                  "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                  activeNav === "code"
                    ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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
                  "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5 group",
                  activeNav === "notebook"
                    ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
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

        {/* Section 3: Courses List */}
        {showLearnerNav && (
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className={cn("flex items-center justify-between group/label px-2 h-6", !open && "justify-center px-0")}>
            {open ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Courses
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                  <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground/60 hover:text-foreground">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground/60 hover:text-foreground">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <span className="h-px w-5 bg-slate-300 dark:bg-zinc-800" />
            )}
          </SidebarGroupLabel>
          
          <SidebarMenu className="gap-0.5">
            {sidebarCourses.map((course) => (
              <SidebarMenuItem key={course.id}>
                <SidebarMenuButton
                  isActive={activeNav === "lessons" && activeCourseId === course.id}
                  onClick={() => onNavChange("lessons", course.id)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 transition-all duration-150 border border-transparent text-[13px] font-medium h-8.5",
                    activeNav === "lessons" && activeCourseId === course.id
                      ? "bg-slate-200/70 dark:bg-zinc-800 text-foreground font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-200/40 dark:hover:bg-zinc-900/40 hover:text-foreground"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center shrink-0">
                    <span className={cn("size-2.5 rounded-sm shrink-0 shadow-xs", course.colorClass)} />
                  </span>
                  {open && (
                    <span className="flex-1 text-left truncate">{course.name}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        )}

      </SidebarContent>

      {/* Footer Profile Dropdown */}
      <SidebarFooter className="pt-2 px-3 pb-3">
        <div className="flex flex-col gap-3">
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent opacity-80" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "group flex items-center gap-3 p-2 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 shadow-2xs hover:shadow-xs hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer outline-none w-full",
              !open && "justify-center px-0 border-0 shadow-none bg-transparent hover:bg-transparent"
            )}>
              <div
                className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ring-1 ring-white/30 dark:ring-white/20 group-hover:ring-white/40 transition-shadow"
                title={displayName || undefined}
              >
                {initials}
              </div>
              
              {open && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {displayName || "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>{roleLabel}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </>
              )}
            </DropdownMenuTrigger>
            
            <DropdownMenuContent
              align="start"
              side="right"
              sideOffset={8}
              className="w-52 p-1"
            >
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onNavChange("profile")}
              >
                <UserIcon className="w-3.5 h-3.5 mr-2" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => onNavChange("settings")}
              >
                <Settings className="w-3.5 h-3.5 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>

    </SidebarRoot>
  );
}
