"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { classService } from "@/lib/services/class-service";
import { userService } from "@/lib/services/user-service";
import type { ClassStudent } from "@/lib/types/class-api";
import type { ClassInvitationDto } from "@/lib/types/class-invitation-api";
import type { UserSummary } from "@/lib/services/user-service";
import { Loader2, UserPlus, X } from "lucide-react";

interface ClassStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number | null;
  className: string;
  canManage: boolean;
}

export function ClassStudentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  canManage,
}: ClassStudentsDialogProps) {
  const [enrolled, setEnrolled] = useState<ClassStudent[]>([]);
  const [pending, setPending] = useState<ClassInvitationDto[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserSummary[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLoadError, setInviteLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setInviteLoadError(null);
    try {
      const roster = await classService.listClassStudents(classId);
      setEnrolled(roster);
      if (canManage) {
        const [invitesResult, usersResult] = await Promise.allSettled([
          classService.listClassInvitations(classId),
          userService.listUsers({ role: "STUDENT", size: 200 }),
        ]);

        const invitations =
          invitesResult.status === "fulfilled" ? invitesResult.value : [];
        setPending(invitations);

        if (usersResult.status === "fulfilled") {
          const blocked = new Set([
            ...roster.map((s) => s.id),
            ...invitations.map((i) => i.studentId),
          ]);
          setAvailableStudents(
            (usersResult.value.items ?? []).filter((s) => !blocked.has(s.id)),
          );
        } else {
          setAvailableStudents([]);
        }

        if (invitesResult.status === "rejected") {
          setInviteLoadError("Could not load pending invitations.");
        } else if (usersResult.status === "rejected") {
          setInviteLoadError(
            "Student directory is unavailable for this account. You can still view roster.",
          );
        }
      } else {
        setPending([]);
        setAvailableStudents([]);
      }
    } catch {
      setError("Could not load class roster.");
      setEnrolled([]);
      setPending([]);
      setAvailableStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && classId) {
      void load();
      setSelectedToAdd([]);
    }
  }, [open, classId, canManage]);

  const handleInvite = async () => {
    if (!classId || selectedToAdd.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await classService.inviteStudents(classId, selectedToAdd);
      await load();
      setSelectedToAdd([]);
      setSuccess("Invitations sent. Students will see them in notifications.");
    } catch {
      setError("Failed to send invitations.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!classId || !canManage) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await classService.removeStudents(classId, [studentId]);
      await load();
    } catch {
      setError("Failed to remove student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-extrabold">
            Class roster
          </DialogTitle>
          <DialogDescription className="text-xs">
            {className} — students must accept an invitation before they can
            enter the class and study.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Enrolled ({enrolled.length})
              </Label>
              <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {enrolled.length === 0 ? (
                  <li className="text-xs text-muted-foreground py-2">
                    No students enrolled yet.
                  </li>
                ) : (
                  enrolled.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 text-xs rounded-lg border border-slate-200/80 dark:border-zinc-800 px-3 py-2"
                    >
                      <span>
                        <span className="font-semibold text-foreground">
                          {s.name}
                        </span>
                        <span className="text-muted-foreground block">
                          {s.email}
                        </span>
                      </span>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-rose-500"
                          disabled={saving}
                          onClick={() => void handleRemove(s.id)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {canManage && pending.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pending invitations ({pending.length})
                </Label>
                <ul className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {pending.map((inv) => (
                    <li
                      key={inv.id}
                      className="text-xs rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-2"
                    >
                      <span className="font-semibold text-foreground">
                        {inv.studentName}
                      </span>
                      <span className="text-muted-foreground block">
                        Awaiting acceptance
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canManage && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Invite students
                </Label>
                {inviteLoadError && (
                  <p className="mt-2 text-xs text-amber-600">
                    {inviteLoadError}
                  </p>
                )}
                <select
                  multiple
                  value={selectedToAdd}
                  onChange={(e) =>
                    setSelectedToAdd(
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                  className="mt-2 w-full min-h-[100px] rounded-md border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-2 text-xs"
                >
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.email}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="mt-2 w-full h-9 text-xs font-bold gap-1.5"
                  disabled={
                    saving ||
                    selectedToAdd.length === 0 ||
                    availableStudents.length === 0
                  }
                  onClick={() => void handleInvite()}
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                  Send invitations
                </Button>
              </div>
            )}

            {success && <p className="text-xs text-emerald-600">{success}</p>}
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
