"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { glassBtnSubtleClass } from "@/components/ui/glass-field";

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
        "[counter-increment:formsec] rounded-2xl overflow-hidden",
        "border border-black/[0.07] dark:border-white/10",
        "bg-white dark:bg-white/2.5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-black/5 dark:border-white/8 px-4 py-3.5 sm:px-5">
        <span
          aria-hidden
          className="mt-px flex h-6 min-w-6 items-center justify-center rounded-lg bg-primary/10 px-1.5 text-[11px] font-bold tabular-nums text-primary ring-1 ring-inset ring-primary/15 before:content-[counter(formsec)]"
        />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
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
          "bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden px-6 pt-6 pb-5 sm:px-7",
            "border-b border-black/[0.07] dark:border-white/8",
            headerGradient,
          )}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
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
              <DialogTitle className="text-lg font-extrabold tracking-tight leading-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm leading-relaxed max-w-xl text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="[counter-reset:formsec] flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-50/70 dark:bg-white/1.5 px-6 py-5 sm:px-7 space-y-4">
          {banner}
          {children}
          {error ? (
            <p
              className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400"
              role="alert"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2",
            "border-t border-black/[0.07] dark:border-white/8 px-6 py-4 sm:px-7",
            "bg-white dark:bg-zinc-950",
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
            className={cn(
              "inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold",
              "bg-primary text-primary-foreground shadow-sm shadow-primary/25",
              "transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
