"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/40 dark:border-white/8",
        "bg-white/35 dark:bg-white/4 backdrop-blur-sm",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        className,
      )}
    >
      <div className="border-b border-white/30 dark:border-white/8 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

type TaskCreateDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  headerGradient: string;
  iconClassName: string;
  banner?: React.ReactNode;
  children: React.ReactNode;
  error?: string | null;
  saving: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => void;
};

export function TaskCreateDialogShell({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  headerGradient,
  iconClassName,
  banner,
  children,
  error,
  saving,
  canSubmit,
  submitLabel,
  onSubmit,
}: TaskCreateDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 p-0 sm:max-w-2xl lg:max-w-3xl overflow-hidden",
          "max-h-[min(92vh,880px)] flex flex-col",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden px-6 pt-6 pb-5 sm:px-7",
            "border-b border-white/25 dark:border-white/8",
            headerGradient,
          )}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/25 blur-2xl dark:bg-white/5" />
          <div className="relative flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                "ring-1 ring-inset shadow-sm",
                iconClassName,
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-lg font-extrabold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm leading-relaxed max-w-xl">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7 space-y-5">
          {banner}
          {children}
          {error ? (
            <p
              className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
            "border-t border-white/25 dark:border-white/8 px-6 py-4 sm:px-7",
            "bg-white/20 dark:bg-black/15 backdrop-blur-md",
          )}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className={cn(glassBtnSubtleClass, "h-10 px-5 text-sm")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !canSubmit}
            onClick={onSubmit}
            className={cn(glassBtnPrimaryClass, "h-10 px-5 text-sm gap-2 min-w-[9rem]")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
