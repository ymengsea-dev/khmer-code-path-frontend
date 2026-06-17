"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared liquid-glass surface — uses CSS vars from globals.css */
export const glassSearchInputClass = cn(
  "glass-search-input w-full pl-11 pr-4 h-12 text-sm",
  "text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400",
  "focus:outline-none focus:ring-2 focus:ring-ring/25"
);

export const glassSelectClass = cn(
  "glass-select h-12 px-4 rounded-2xl text-sm font-semibold min-w-0",
  "text-zinc-700 dark:text-zinc-100",
  "focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-50 disabled:cursor-not-allowed"
);

export const glassPageTitleClass = cn(
  "glass-page-title flex items-center min-w-0 shrink-0"
);

export const glassInputClass = cn(
  "glass-input w-full h-11 px-4 text-sm",
  "text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400",
  "focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-60"
);

export const glassBtnPrimaryClass = cn(
  "glass-btn-primary inline-flex items-center justify-center",
  "rounded-xl px-4 h-10 text-sm font-semibold text-white outline-none select-none",
  "disabled:pointer-events-none disabled:opacity-50"
);

export const glassBtnSubtleClass = cn(
  "liquid-glass-btn-subtle liquid-glass-btn inline-flex items-center justify-center",
  "rounded-xl px-4 h-10 text-sm font-semibold text-foreground outline-none select-none",
  "disabled:pointer-events-none disabled:opacity-50"
);

type GlassSearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  iconClassName?: string;
  /** Smaller compact variant (notebook sidebar, etc.) */
  size?: "default" | "sm";
};

export const GlassSearchInput = React.forwardRef<HTMLInputElement, GlassSearchInputProps>(
  ({ className, containerClassName, iconClassName, size = "default", ...props }, ref) => (
    <div className={cn("relative flex-1 w-full min-w-0", containerClassName)}>
      <Search
        className={cn(
          "absolute z-10 pointer-events-none text-zinc-400",
          size === "sm"
            ? "left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            : "left-4 top-1/2 h-4 w-4 -translate-y-1/2",
          iconClassName
        )}
      />
      <input
        ref={ref}
        type="search"
        className={cn(
          size === "sm"
            ? "glass-search-input glass-search-input-sm w-full pl-8 pr-3 h-9 text-[13px]"
            : glassSearchInputClass,
          className
        )}
        {...props}
      />
    </div>
  )
);
GlassSearchInput.displayName = "GlassSearchInput";

type GlassInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(glassInputClass, className)} {...props} />
  )
);
GlassInput.displayName = "GlassInput";

type GlassSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(glassSelectClass, className)} {...props}>
      {children}
    </select>
  )
);
GlassSelect.displayName = "GlassSelect";

type GlassPageTitleProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassPageTitle({ className, children, ...props }: GlassPageTitleProps) {
  return (
    <div className={cn(glassPageTitleClass, className)} {...props}>
      {children}
    </div>
  );
}
