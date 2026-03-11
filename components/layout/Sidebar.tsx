"use client";

import {
  LayoutGrid,
  User,
  BookOpen,
  Users,
  ChevronRight,
  Sparkles,
  Code2,
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
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutGrid, label: "Course View", id: "courses" },
  { icon: Code2, label: "Code", id: "code" },
  { icon: BookOpen, label: "My Learning", id: "learning" },
  { icon: Users, label: "Community", id: "community" },
  { icon: User, label: "Profile", id: "profile" },
];

interface AppSidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  className?: string;
}

function SidebarLogo() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 text-sidebar-foreground">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 dark:shadow-indigo-400/15 ring-1 ring-white/20 dark:ring-white/10">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white drop-shadow-sm"
            >
              <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
            </svg>
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500 ring-2 ring-sidebar dark:ring-sidebar"
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-[15px] tracking-tight truncate block text-foreground">
            Khmer Code Path
          </span>
          <span className="text-xs text-muted-foreground truncate block font-medium">
            Learn • Build • Grow
          </span>
        </div>
      </div>
    </div>
  );
}

function SidebarUserFooter() {
  return (
    <div className="flex flex-col gap-3">
      <Separator className="bg-gradient-to-r from-transparent via-border to-transparent opacity-80" />
      <div className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-sidebar-accent/80 to-sidebar-accent/50 dark:from-sidebar-accent/60 dark:to-sidebar-accent/30 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md ring-2 ring-white/30 dark:ring-white/20 group-hover:ring-white/40 transition-shadow">
          MX
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            Meng Xea
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>Learner</span>
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

export function Sidebar({ activeNav, onNavChange, className }: AppSidebarProps) {
  return (
    <SidebarRoot side="left" className={cn("shrink-0", className)}>
      <SidebarHeader className="pb-5 pt-1">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="gap-5 px-3">
        <SidebarGroup className="space-y-2">
          <SidebarGroupLabel className="flex items-center gap-2 px-2">
            <span className="h-px flex-1 max-w-4 bg-gradient-to-r from-muted-foreground/40 to-transparent rounded-full" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/90">
              Menu
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-muted-foreground/40 to-transparent rounded-full" />
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {navItems.map(({ icon: Icon, label, id }) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={activeNav === id}
                  onClick={() => onNavChange(id)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 transition-all duration-200 border border-transparent",
                    activeNav === id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-border/50 dark:border-border/30 shadow-black/5 dark:shadow-black/10"
                      : "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors duration-200",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left font-medium text-sm">
                    {label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pt-4 px-4 pb-4">
        <SidebarUserFooter />
      </SidebarFooter>
    </SidebarRoot>
  );
}
