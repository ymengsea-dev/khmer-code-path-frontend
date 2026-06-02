"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type DialogVariant = "default" | "destructive" | "success" | "info";

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel: string;
  cancelLabel: string | null;
}

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface AlertOptions {
  title?: string;
  variant?: DialogVariant;
}

interface ConfirmContextValue {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, options?: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const VARIANT_ICONS: Record<DialogVariant, React.ReactNode> = {
  destructive: <XCircle className="h-5 w-5 text-destructive" />,
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  default: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

const DEFAULT_STATE: DialogState = {
  open: false,
  title: "Are you sure?",
  message: "",
  variant: "default",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(DEFAULT_STATE);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title: options?.title ?? "Are you sure?",
          message,
          variant: options?.variant ?? "default",
          confirmLabel: options?.confirmLabel ?? "Confirm",
          cancelLabel: options?.cancelLabel ?? "Cancel",
        });
      });
    },
    []
  );

  const alert = useCallback(
    (message: string, options?: AlertOptions): Promise<void> => {
      return new Promise((resolve) => {
        resolveRef.current = (val: boolean) => {
          void val;
          resolve();
        };
        setState({
          open: true,
          title: options?.title ?? "Notice",
          message,
          variant: options?.variant ?? "info",
          confirmLabel: "OK",
          cancelLabel: null,
        });
      });
    },
    []
  );

  const handleConfirm = () => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      <Dialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              {VARIANT_ICONS[state.variant]}
              {state.title}
            </DialogTitle>
            {state.message && (
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                {state.message}
              </DialogDescription>
            )}
          </DialogHeader>

          <DialogFooter className="gap-2">
            {state.cancelLabel && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                {state.cancelLabel}
              </Button>
            )}
            <Button
              size="sm"
              variant={state.variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {state.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
