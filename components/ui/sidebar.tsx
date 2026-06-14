"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SIDEBAR_WIDTH = "17rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "4rem";

const SidebarContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: true, setOpen: () => {} });

function SidebarProvider({
  children,
  defaultOpen = true,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div
        data-sidebar="provider"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function useSidebar() {
  const context = React.useContext(SidebarContext);
  return context ?? { open: true, setOpen: () => {} };
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }
>(({ className, side = "left", ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="root"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "flex h-[calc(100%-1.5rem)] flex-col text-sidebar-foreground overflow-hidden transition-all duration-300 ease-in-out my-3 ml-3 rounded-[28px]",
        open ? "w-(--sidebar-width)" : "w-(--sidebar-width-icon)",
        "bg-white/56 border border-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.75),inset_0_0_0_1px_rgb(255_255_255/0.18)]",
        "shadow-2xl shadow-zinc-950/8 dark:bg-zinc-200/10 dark:border-white/12 dark:shadow-black/22",
        side === "right" && "mr-3 ml-0",
        className
      )}
      {...props}
    />
  );
});
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn("flex flex-col gap-2 p-4", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn("flex flex-1 flex-col gap-2 overflow-auto px-2 py-4", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn("flex flex-col gap-2 p-4", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group"
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-label"
    className={cn(
      "px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
    {...props}
  />
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("list-none", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean;
    tooltip?: string;
  }
>(({ className, isActive, tooltip, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      title={tooltip}
      className={cn(
        "w-full justify-start gap-3.5 rounded-xl font-medium overflow-hidden transition-all duration-150",
        !open && "justify-center px-0",
        isActive
          ? "bg-zinc-200/70 text-zinc-950 shadow-none hover:bg-zinc-200/80 hover:text-zinc-950 dark:bg-white/14 dark:text-white"
          : "text-zinc-800 hover:bg-zinc-200/45 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/8 dark:hover:text-white",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { open, setOpen } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={() => setOpen(!open)}
      className={cn("shrink-0", className)}
      aria-label="Toggle sidebar"
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    data-sidebar="inset"
    className={cn("relative flex flex-col h-full flex-1 min-w-0 overflow-hidden", className)}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
