"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Hash,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  GlassSelect,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { Badge } from "@/components/ui/badge";
import {
  userService,
  type StudentDetail,
} from "@/lib/services/user-service";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { cn } from "@/lib/utils";

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/8">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active?: boolean }) {
  const isActive = active !== false;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide",
        isActive
          ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          : "border-slate-500/30 bg-slate-500/10 text-muted-foreground",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

interface StudentProfileSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEditStatus?: boolean;
  statusSaving?: boolean;
  activeOverride?: boolean;
  onStatusChange?: (userId: string, isActive: boolean) => void;
}

export function StudentProfileSheet({
  studentId,
  open,
  onOpenChange,
  canEditStatus = false,
  statusSaving = false,
  activeOverride,
  onStatusChange,
}: StudentProfileSheetProps) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !studentId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getStudent(studentId);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) {
          setError("Could not load student profile.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  useEffect(() => {
    if (activeOverride === undefined || !detail) return;
    setDetail((prev) =>
      prev ? { ...prev, isActive: activeOverride } : null,
    );
  }, [activeOverride, detail?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden border-l-0"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(32px) saturate(1.8)",
          WebkitBackdropFilter: "blur(32px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        }}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/8 shrink-0 text-left">
          <SheetTitle className="text-lg font-extrabold pr-8">
            Student Profile
          </SheetTitle>
          <SheetDescription className="sr-only">
            Student profile details
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {!loading && detail && (
            <>
              <div className="flex flex-col items-center text-center gap-3 pt-1">
                <UserAvatar
                  name={detail.name}
                  avatarUrl={detail.avatarUrl}
                  className="h-20 w-20 ring-2 ring-white/50 shadow-md"
                  textClassName="text-xl"
                />
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {detail.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {detail.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {canEditStatus && onStatusChange ? (
                    <GlassSelect
                      className="h-9 min-w-[120px] text-xs font-semibold"
                      value={detail.isActive !== false ? "active" : "inactive"}
                      disabled={statusSaving}
                      onChange={(e) => {
                        const isActive = e.target.value === "active";
                        setDetail((prev) =>
                          prev ? { ...prev, isActive } : null,
                        );
                        onStatusChange(detail.id, isActive);
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </GlassSelect>
                  ) : (
                    <StatusBadge active={detail.isActive} />
                  )}
                  {detail.studentId && (
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {detail.studentId}
                    </Badge>
                  )}
                </div>
              </div>

              {detail.bio && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm text-muted-foreground leading-relaxed"
                  style={{
                    background: "var(--glass-bg-subtle)",
                    border: "1px solid var(--glass-border-color-subtle)",
                  }}
                >
                  {detail.bio}
                </div>
              )}

              <div className="space-y-4">
                <ProfileField
                  icon={Mail}
                  label="Email"
                  value={detail.email}
                />
                <ProfileField
                  icon={Hash}
                  label="Student ID"
                  value={detail.studentId || "—"}
                />
                <ProfileField
                  icon={GraduationCap}
                  label="Enrolled classes"
                  value={detail.enrolledClasses || "Not enrolled in any class"}
                />
                <ProfileField
                  icon={UserRound}
                  label="Member since"
                  value={
                    detail.memberSince
                      ? new Date(detail.memberSince).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : "—"
                  }
                />
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-black/5 dark:border-white/8 px-6 py-4">
          <button
            type="button"
            className={cn(glassBtnSubtleClass, "w-full")}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
