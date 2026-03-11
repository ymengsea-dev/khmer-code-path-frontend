"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";

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
>(({ className, side = "left", ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="root"
    className={cn(
      "flex h-full w-[var(--sidebar-width)] flex-col text-sidebar-foreground backdrop-blur-2xl backdrop-saturate-200 overflow-hidden",
      "bg-slate-100/95 dark:bg-sidebar/90 border-border shadow-[0_0_0_1px_rgba(0,0,0,0.06)_inset] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]",
      "shadow-lg shadow-black/5 dark:shadow-black/20",
      side === "left" && "border-r rounded-r-2xl",
      side === "right" && "border-l rounded-l-2xl",
      className
    )}
    {...props}
  />
));
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
>(({ className, isActive, tooltip, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="sm"
    title={tooltip}
    className={cn(
      "w-full justify-start gap-3 font-normal",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
      className
    )}
    {...props}
  />
));
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
    className={cn("relative flex-1 min-w-0 overflow-hidden", className)}
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
