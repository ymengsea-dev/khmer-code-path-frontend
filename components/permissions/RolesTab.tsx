"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassSelect } from "@/components/ui/glass-field";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { userService, type UserSummary } from "@/lib/services/user-service";
import type { AssignableRole, PermissionsConfig } from "@/lib/types/permissions-api";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

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

function EditableStatusCell({
  userId,
  isActive,
  canEdit,
  saving,
  onStatusChange,
}: {
  userId: string;
  isActive?: boolean;
  canEdit: boolean;
  saving: boolean;
  onStatusChange: (userId: string, isActive: boolean) => void;
}) {
  if (!canEdit) {
    return <StatusBadge active={isActive} />;
  }

  return (
    <GlassSelect
      className="h-8 min-w-[112px] text-xs font-semibold px-2.5"
      value={isActive !== false ? "active" : "inactive"}
      disabled={saving}
      onChange={(e) => onStatusChange(userId, e.target.value === "active")}
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </GlassSelect>
  );
}

export function RolesTab({ config }: { config: PermissionsConfig | null }) {
  const { data: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ userId: string; message: string } | null>(null);

  const assignableRoles = config?.assignableRoles ?? [];

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await userService.listUsers({ size: 500 });
      setUsers(page.items ?? []);
    } catch {
      setLoadError("Could not load school members.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const roleOrder = (role: string) => {
          if (role === "ADMIN") return 0;
          if (role === "TEACHER") return 1;
          return 2;
        };
        const byRole = roleOrder(a.role) - roleOrder(b.role);
        if (byRole !== 0) return byRole;
        return a.name.localeCompare(b.name);
      }),
    [users],
  );

  const handleRoleChange = async (userId: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.role === role) return;

    setRoleSavingId(userId);
    setRowError(null);
    try {
      const updated = await userService.updateRole(
        userId,
        role as "STUDENT" | "TEACHER" | "ADMIN",
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ??
          "Could not update role.")
        : "Could not update role.";
      setRowError({ userId, message });
    } finally {
      setRoleSavingId(null);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const currentlyActive = user.isActive !== false;
    if (currentlyActive === isActive) return;

    setStatusSavingId(userId);
    setRowError(null);
    try {
      const updated = await userService.updateStatus(userId, isActive);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ??
          "Could not update status.")
        : "Could not update status.";
      setRowError({ userId, message });
    } finally {
      setStatusSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-extrabold text-foreground">
          {config?.rolesSectionTitle ?? "School members"}
        </h2>
        {config?.rolesSectionDescription && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {config.rolesSectionDescription}
          </p>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          {loadError}
        </p>
      )}

      {sortedUsers.length === 0 ? (
        <Card bouncy={false} className="rounded-2xl p-6 text-sm text-muted-foreground text-center">
          No users found at your school.
        </Card>
      ) : (
        <Card bouncy={false} className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">{config?.roleColumnLabel ?? "Role"}</th>
                  <th className="px-5 py-3">{config?.statusColumnLabel ?? "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80 text-[12px]">
                {sortedUsers.map((user) => {
                  const isSelf = currentUser?.userId === user.id;
                  const isRoleSaving = roleSavingId === user.id;
                  const isStatusSaving = statusSavingId === user.id;
                  const error = rowError?.userId === user.id ? rowError.message : null;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            name={user.name}
                            avatarUrl={user.avatarUrl}
                            className="h-8 w-8"
                            textClassName="text-[10px]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {user.name}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {error && (
                              <p className="text-xs text-destructive mt-1">{error}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <GlassSelect
                            value={user.role}
                            disabled={isSelf || isRoleSaving || assignableRoles.length === 0}
                            onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                            className="h-9 text-xs"
                          >
                            {assignableRoles.map((role) => (
                              <option key={role.role} value={role.role}>
                                {role.label}
                              </option>
                            ))}
                          </GlassSelect>
                          {isRoleSaving && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {isSelf && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Your role cannot be changed here.
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <EditableStatusCell
                          userId={user.id}
                          isActive={user.isActive}
                          canEdit={!isSelf}
                          saving={isStatusSaving}
                          onStatusChange={(id, active) => void handleStatusChange(id, active)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
