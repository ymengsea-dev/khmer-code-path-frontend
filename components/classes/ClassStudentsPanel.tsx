"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { classService } from "@/lib/services/class-service";
import type { ClassStudent } from "@/lib/types/class-api";
import type { ClassInvitationDto } from "@/lib/types/class-invitation-api";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { InviteStudentsModal } from "@/components/classes/InviteStudentsModal";

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
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 w-full sm:w-auto")}
          >
            <UserPlus className="h-4 w-4" />
            Invite students
          </button>
          <InviteStudentsModal
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            classId={classId}
            onInvited={() => void handleInvited()}
          />
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pending invitations ({pending.length})
          </p>
          <ul className="space-y-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-indigo-500/20 bg-indigo-500/5"
              >
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{inv.studentName}</p>
                  <p className="text-[11px] text-muted-foreground">Awaiting acceptance</p>
                </div>
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </li>
            ))}
          </ul>
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
          <ul
            className={cn(
              "space-y-2",
              editing && cn(ROSTER_SCROLL_MAX_HEIGHT, "overflow-y-auto scrollbar-hide pr-1"),
            )}
          >
            {(editing ? enrolled : enrolled.slice(0, VIEW_MODE_ROW_LIMIT)).map(
              (student, index) => (
            <li
              key={student.id}
              className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-black/5"
            >
              <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                {String(index + 1).padStart(2, "0")}
              </span>
              <UserAvatar
                name={student.name}
                avatarUrl={student.avatarUrl}
                className="h-8 w-8"
                textClassName="text-[10px]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{student.name}</p>
                {student.email ? (
                  <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                ) : null}
              </div>
              {editing ? (
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
              ) : null}
            </li>
              ),
            )}
          </ul>
        </div>
      )}

      {success && <p className="text-xs text-emerald-600">{success}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
