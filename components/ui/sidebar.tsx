"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readPinnedPreference,
  writePinnedPreference,
  syncPinnedDataset,
  markSidebarHydrated,
} from "@/lib/sidebar-preference";

const SIDEBAR_WIDTH = "17rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_EDGE_ZONE_PX = 14;
const SIDEBAR_PEEK_LEAVE_MS = 320;
const SIDEBAR_DOCK_DURATION_MS = 380;

type SidebarContextValue = {
  /** Sidebar is docked open and pushes main content */
  pinned: boolean;
  setPinned: (open: boolean) => void;
  /** Temporary in-flow reveal while collapsed (hover edge) */
  peekOpen: boolean;
  setPeekOpen: (open: boolean) => void;
  /** Panel is visible with full labels */
  expanded: boolean;
  togglePinned: () => void;
  openPeek: () => void;
  schedulePeekClose: () => void;
  clearPeekClose: () => void;
  /** @deprecated use pinned */
  open: boolean;
  /** @deprecated use setPinned */
  setOpen: (open: boolean) => void;
  /** Animations enabled after localStorage preference is applied */
  hydrated: boolean;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function SidebarProvider({
  children,
  defaultOpen = false,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const [pinned, setPinnedState] = React.useState(defaultOpen);
  const [peekOpen, setPeekOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const peekLeaveTimer = React.useRef<number | null>(null);
  const peekBlockedUntil = React.useRef(0);

  React.useLayoutEffect(() => {
    const stored = readPinnedPreference(defaultOpen);
    setPinnedState(stored);
    syncPinnedDataset(stored);
    markSidebarHydrated();
    setHydrated(true);
  }, [defaultOpen]);

  const clearPeekLeaveTimer = React.useCallback(() => {
    if (peekLeaveTimer.current != null) {
      window.clearTimeout(peekLeaveTimer.current);
      peekLeaveTimer.current = null;
    }
  }, []);

  const setPinned = React.useCallback(
    (open: boolean) => {
      clearPeekLeaveTimer();
      setPinnedState(open);
      if (!open) setPeekOpen(false);
      writePinnedPreference(open);
    },
    [clearPeekLeaveTimer],
  );

  const schedulePeekClose = React.useCallback(() => {
    clearPeekLeaveTimer();
    peekLeaveTimer.current = window.setTimeout(() => {
      setPeekOpen(false);
      peekBlockedUntil.current = Date.now() + SIDEBAR_DOCK_DURATION_MS + 100;
      peekLeaveTimer.current = null;
    }, SIDEBAR_PEEK_LEAVE_MS);
  }, [clearPeekLeaveTimer]);

  const openPeek = React.useCallback(() => {
    if (pinned || Date.now() < peekBlockedUntil.current) return;
    clearPeekLeaveTimer();
    setPeekOpen(true);
  }, [pinned, clearPeekLeaveTimer]);

  const togglePinned = React.useCallback(() => {
    clearPeekLeaveTimer();
    setPinnedState((current) => {
      const next = !current;
      if (!next) setPeekOpen(false);
      writePinnedPreference(next);
      return next;
    });
  }, [clearPeekLeaveTimer]);

  React.useEffect(() => () => clearPeekLeaveTimer(), [clearPeekLeaveTimer]);

  const expanded = pinned || peekOpen;

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      pinned,
      setPinned,
      peekOpen,
      setPeekOpen,
      expanded,
      togglePinned,
      openPeek,
      schedulePeekClose,
      clearPeekClose: clearPeekLeaveTimer,
      open: pinned,
      setOpen: setPinned,
      hydrated,
    }),
    [
      pinned,
      peekOpen,
      expanded,
      setPinned,
      togglePinned,
      openPeek,
      schedulePeekClose,
      clearPeekLeaveTimer,
      hydrated,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-sidebar="provider"
        className={cn("flex h-full w-full min-h-0 overflow-hidden", className)}
        style={
          {
            ...style,
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            "--sidebar-edge-zone": `${SIDEBAR_EDGE_ZONE_PX}px`,
            "--sidebar-dock-duration": `${SIDEBAR_DOCK_DURATION_MS}ms`,
          } as React.CSSProperties
        }
        {...props}
      >
        {!pinned && !peekOpen ? (
          <div
            aria-hidden
            className="fixed inset-y-0 left-0 z-50"
            style={{ width: SIDEBAR_EDGE_ZONE_PX }}
            onMouseEnter={openPeek}
          />
        ) : null}
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    return {
      pinned: true,
      setPinned: () => {},
      peekOpen: false,
      setPeekOpen: () => {},
      expanded: true,
      togglePinned: () => {},
      openPeek: () => {},
      schedulePeekClose: () => {},
      clearPeekClose: () => {},
      open: true,
      setOpen: () => {},
      hydrated: true,
    };
  }
  return context;
}

const sidebarPanelClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden border-zinc-200/90 bg-white text-sidebar-foreground dark:border-white/10 dark:bg-[rgb(28,28,36)]";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }
>(({ className, side = "left", ...props }, ref) => {
  const { pinned, peekOpen, openPeek, schedulePeekClose, clearPeekClose, hydrated } =
    useSidebar();
  const dockOpen = pinned || peekOpen;

  return (
    <div
      data-sidebar="dock"
      data-open={dockOpen ? "true" : "false"}
      className={cn(
        "sidebar-dock h-full min-h-0 shrink-0 overflow-hidden",
        !hydrated && "sidebar-dock-instant",
      )}
      onMouseEnter={() => {
        if (!pinned) {
          clearPeekClose();
          openPeek();
        }
      }}
      onMouseLeave={() => {
        if (!pinned) schedulePeekClose();
      }}
    >
      <aside
        ref={ref}
        data-sidebar="root"
        data-state={pinned ? "pinned" : peekOpen ? "peek" : "hidden"}
        data-open={dockOpen ? "true" : "false"}
        data-side={side}
        className={cn(
          sidebarPanelClass,
          "sidebar-dock-panel h-full w-[var(--sidebar-width)] border-r",
          !pinned && peekOpen && "shadow-lg shadow-black/5 dark:shadow-black/30",
          className,
        )}
        {...props}
      />
    </div>
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
    className={cn("flex flex-1 flex-col gap-2 overflow-auto px-2 py-4 scrollbar-hide", className)}
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
      className,
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
  return (
    <button
      ref={ref}
      title={tooltip}
      style={isActive ? { backgroundColor: "rgba(208, 212, 218, 0.45)" } : undefined}
      className={cn(
        "flex h-10 w-full items-center gap-3.5 overflow-hidden rounded-xl px-3 text-sm font-medium outline-none transition-all duration-150",
        isActive
          ? "text-zinc-900 dark:bg-white/14 dark:text-white"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white",
        !isActive && "sidebar-nav-hover",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { togglePinned, pinned, hydrated } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      onClick={togglePinned}
      className={cn(
        "topbar-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
        className,
      )}
      aria-label={pinned ? "Hide sidebar" : "Show sidebar"}
      aria-pressed={pinned}
      {...props}
    >
      <PanelLeft
        className={cn(
          "sidebar-trigger-icon h-4 w-4",
          !hydrated && "sidebar-dock-instant",
        )}
        data-pinned={pinned ? "true" : "false"}
      />
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { hydrated } = useSidebar();
  return (
    <main
      ref={ref}
      data-sidebar="inset"
      className={cn(
        "sidebar-inset relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        !hydrated && "sidebar-inset-instant",
        className,
      )}
      {...props}
    />
  );
});
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
