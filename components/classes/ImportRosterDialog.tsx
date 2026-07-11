"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { glassBtnPrimaryClass, glassBtnSubtleClass } from "@/components/ui/glass-field";
import { classService } from "@/lib/services/class-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface ImportRosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  onImported?: () => void;
}

interface ImportResult {
  invited: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export function ImportRosterDialog({
  open,
  onOpenChange,
  classId,
  onImported,
}: ImportRosterDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setResult(null);
    setError(null);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await classService.importRoster(classId, file);
      setResult(res);
      if (res.invited > 0) onImported?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Import failed. Use a valid CSV or XLSX file with an 'email' column."));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden max-h-[85vh]",
          "!bg-white dark:!bg-[rgb(28,28,36)]",
          "backdrop-blur-none [backdrop-filter:none] [-webkit-backdrop-filter:none]",
          "border-slate-200 dark:border-white/12",
          "shadow-2xl",
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/8 shrink-0 text-left">
          <DialogTitle className="text-lg font-extrabold pr-8">Import roster</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a CSV or XLSX with an <span className="font-mono">email</span> column. Existing
            students are invited; unknown emails are skipped (no account is created).
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-500/20"
          />

          {result && (
            <div className="space-y-2 rounded-xl border border-black/5 dark:border-white/8 p-3">
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600 font-semibold">{result.invited} invited</span>
                <span className="text-muted-foreground">{result.skipped} skipped</span>
                <span className={cn(result.failed > 0 ? "text-rose-600" : "text-muted-foreground")}>
                  {result.failed} failed
                </span>
              </div>
              {result.errors.length > 0 && (
                <ul className="space-y-1 max-h-32 overflow-y-auto text-[11px] text-rose-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <div className="px-6 pb-6 pt-2 flex justify-end gap-2 border-t border-black/5 dark:border-white/8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(glassBtnSubtleClass, "h-10 px-4")}
          >
            {result ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={!file || importing}
            className={cn(glassBtnPrimaryClass, "gap-2 h-10 px-4 disabled:opacity-50")}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
