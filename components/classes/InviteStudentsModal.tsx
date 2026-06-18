"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GlassSearchInput,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { classService } from "@/lib/services/class-service";
import type { ClassStudent } from "@/lib/types/class-api";
import { cn } from "@/lib/utils";

interface InviteStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  onInvited?: () => void;
}

function matchesCandidate(student: ClassStudent, query: string) {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return (
    student.name.toLowerCase().includes(needle) ||
    student.email.toLowerCase().includes(needle) ||
    (student.studentId?.toLowerCase().includes(needle) ?? false)
  );
}

export function InviteStudentsModal({
  open,
  onOpenChange,
  classId,
  onInvited,
}: InviteStudentsModalProps) {
  const [candidates, setCandidates] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await classService.listInviteCandidates(classId);
      setCandidates(rows);
    } catch {
      setCandidates([]);
      setError("Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedIds([]);
    setSuccess(null);
    setError(null);
    void loadCandidates();
  }, [open, loadCandidates]);

  const filteredCandidates = useMemo(
    () => candidates.filter((student) => matchesCandidate(student, search)),
    [candidates, search],
  );

  const toggleSelected = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    const inviteCount = selectedIds.length;
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await classService.inviteStudents(classId, selectedIds);
      setSelectedIds([]);
      await loadCandidates();
      onInvited?.();
      setSuccess(
        inviteCount === 1
          ? "Invitation sent. The student can accept it from notifications."
          : `${inviteCount} invitations sent. Students can accept them from notifications.`,
      );
    } catch {
      setError("Could not send invitations.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden max-h-[85vh]",
          "!bg-white dark:!bg-[rgb(28,28,36)]",
          "backdrop-blur-none [backdrop-filter:none] [-webkit-backdrop-filter:none]",
          "border-slate-200 dark:border-white/12",
          "shadow-2xl",
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/8 shrink-0 text-left">
          <DialogTitle className="text-lg font-extrabold pr-8">
            Invite students
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select students to invite. They must accept before they can access
            class lessons.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3 flex-1 min-h-0 flex flex-col">
          <GlassSearchInput
            placeholder="Search by name, email, or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide -mx-1 px-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {candidates.length === 0
                  ? "No students available to invite."
                  : "No students match your search."}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredCandidates.map((student) => {
                  const selected = selectedIds.includes(student.id);
                  return (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => toggleSelected(student.id)}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 flex items-center gap-3 border text-left transition-colors",
                          selected
                            ? "border-indigo-500/35 bg-indigo-500/10"
                            : "border-black/5 hover:bg-white/30 dark:hover:bg-white/5",
                        )}
                      >
                        <UserAvatar
                          name={student.name}
                          avatarUrl={student.avatarUrl}
                          className="h-9 w-9"
                          textClassName="text-[11px]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {student.email}
                            {student.studentId ? ` · ${student.studentId}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "h-5 w-5 rounded-md border shrink-0 flex items-center justify-center text-[10px] font-bold",
                            selected
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-black/15 bg-white/40 dark:bg-white/5",
                          )}
                          aria-hidden
                        >
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {success && <p className="text-xs text-emerald-600">{success}</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-black/5 dark:border-white/8 flex flex-col-reverse sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            className={cn(glassBtnSubtleClass, "h-11 px-4")}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0 || inviting}
            onClick={() => void handleInvite()}
            className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 sm:ml-auto")}
          >
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Send invitation{selectedIds.length > 1 ? "s" : ""}
            {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
