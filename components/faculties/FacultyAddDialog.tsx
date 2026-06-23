"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassInput, glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { getApiErrorMessage } from "@/lib/api-error";
import { facultyService } from "@/lib/services/faculty-service";
import type { FacultyConfigDto } from "@/lib/types/faculty-api";
import { cn } from "@/lib/utils";

export function FacultyAddDialog({
  open,
  onOpenChange,
  config,
  saving,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FacultyConfigDto | null;
  saving: boolean;
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await onAdd(trimmed);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not create faculty."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{config?.addButtonLabel ?? "Add faculty"}</DialogTitle>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{config?.nameLabel ?? "Faculty name"}</Label>
            <GlassInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config?.nameLabel ?? "Faculty name"}
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className={cn(glassBtnPrimaryClass, "h-9 w-full text-xs font-semibold gap-1.5")}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {config?.addButtonLabel ?? "Add faculty"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
