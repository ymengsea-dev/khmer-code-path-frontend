"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, Mail, Trash2, Upload, UserPlus } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { classService } from "@/lib/services/class-service";
import type { ClassStudent } from "@/lib/types/class-api";
import type { ClassInvitationDto } from "@/lib/types/class-invitation-api";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { InviteStudentsModal } from "@/components/classes/InviteStudentsModal";
import { ImportRosterDialog } from "@/components/classes/ImportRosterDialog";

const VIEW_MODE_ROW_LIMIT = 5;
/** ~52px per row + gap — fits five roster rows in view mode */
const ROSTER_SCROLL_MAX_HEIGHT = "max-h-[280px]";

interface ClassStudentsPanelProps {
  classId: number;
  editing: boolean;
  onRosterChanged?: () => void;
}

export function ClassStudentsPanel({
  classId,
  editing,
  onRosterChanged,
}: ClassStudentsPanelProps) {
  const { confirm } = useConfirm();
  const [enrolled, setEnrolled] = useState<ClassStudent[]>([]);
  const [pending, setPending] = useState<ClassInvitationDto[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roster, invitations] = await Promise.all([
        classService.listClassStudents(classId),
        classService.listClassInvitations(classId),
      ]);
      setEnrolled(roster);
      setPending(invitations);
    } catch {
      setEnrolled([]);
      setPending([]);
      setError("Could not load class roster.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    if (editing) {
      setSuccess(null);
    }
  }, [editing]);

  const handleInvited = async () => {
    await loadRoster();
    onRosterChanged?.();
    setSuccess("Invitation sent. The student can accept it from notifications.");
  };

  const handleRemove = async (student: ClassStudent) => {
    const ok = await confirm(`Remove ${student.name} from this class?`, {
      title: "Remove student",
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    setRemovingId(student.id);
    setError(null);
    setSuccess(null);
    try {
      await classService.removeStudents(classId, [student.id]);
      await loadRoster();
      onRosterChanged?.();
    } catch {
      setError("Could not remove student from this class.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editing && (
        <div className="space-y-2 pb-2">
          <p className="text-xs text-muted-foreground">
            Invite students to this class. They must accept the invitation before
            they can open lessons and study.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 w-full sm:w-auto")}
            >
              <UserPlus className="h-4 w-4" />
              Invite students
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 w-full sm:w-auto")}
            >
              <Upload className="h-4 w-4" />
              Import roster
            </button>
          </div>
          <InviteStudentsModal
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            classId={classId}
            onInvited={() => void handleInvited()}
          />
          <ImportRosterDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            classId={classId}
            onImported={() => void handleInvited()}
          />
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pending invitations ({pending.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left border-collapse text-[12px]">
              <thead className="bg-transparent">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80">
                {pending.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-foreground truncate">{inv.studentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        Awaiting acceptance
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {enrolled.length === 0 && pending.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No students yet.
          {editing
            ? " Invite a student above to get started."
            : " Click Edit to invite students to this class."}
        </p>
      ) : enrolled.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No enrolled students yet. Pending invitations are listed above.
        </p>
      ) : (
        <div className="space-y-2">
          {!editing && enrolled.length > VIEW_MODE_ROW_LIMIT ? (
            <p className="text-[11px] text-muted-foreground">
              Showing {VIEW_MODE_ROW_LIMIT} of {enrolled.length} students. Click
              Edit to see the full roster.
            </p>
          ) : null}
          <div
            className={cn(
              "overflow-x-auto",
              editing && cn(ROSTER_SCROLL_MAX_HEIGHT, "overflow-y-auto scrollbar-hide"),
            )}
          >
            <table className="w-full min-w-[420px] text-left border-collapse text-[12px]">
              <thead className="bg-transparent">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Student</th>
                  {editing && <th className="px-5 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80">
                {(editing ? enrolled : enrolled.slice(0, VIEW_MODE_ROW_LIMIT)).map(
                  (student, index) => (
                    <tr key={student.id} className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors">
                      <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            name={student.name}
                            avatarUrl={student.avatarUrl}
                            className="h-8 w-8"
                            textClassName="text-[10px]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{student.name}</p>
                            {student.email ? (
                              <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      {editing && (
                        <td className="px-5 py-3.5 text-right">
                          <GlassButton
                            subtle
                            className="h-8 w-8 p-0 rounded-lg shrink-0"
                            disabled={removingId === student.id}
                            onClick={() => void handleRemove(student)}
                            aria-label={`Remove ${student.name}`}
                          >
                            {removingId === student.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </GlassButton>
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {success && <p className="text-xs text-emerald-600">{success}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
