"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  FileUp,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import {
  GlassSearchInput,
  GlassSelect,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import {
  userService,
  type UserManagementConfig,
  type UserSummary,
} from "@/lib/services/user-service";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import {
  QueryKey,
  parseUserTab,
  parseUserStatus,
  parseUserClass,
  type UserManagementTab,
  type UserStatusFilter,
} from "@/lib/navigation/app-query";
import { AddUserDialog } from "./AddUserDialog";
import { UserPermissionsTab } from "./UserPermissionsTab";
import { StudentProfileSheet } from "./StudentProfileSheet";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type AppRole = "student" | "teacher" | "admin";

function roleForTab(tab: UserManagementTab): string | undefined {
  if (tab === "all" || tab === "permissions") return undefined;
  if (tab === "students") return "STUDENT";
  if (tab === "teachers") return "TEACHER";
  if (tab === "admins") return "ADMIN";
  return undefined;
}

function roleLabel(role: string) {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "Administrator";
    case "TEACHER":
      return "Teacher";
    case "STUDENT":
      return "Student";
    default:
      return role || "—";
  }
}

function UserCell({ user }: { user: UserSummary }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserAvatar
        name={user.name}
        avatarUrl={user.avatarUrl}
        className="h-8 w-8"
        textClassName="text-[10px]"
      />
      <div className="min-w-0">
        <p className="font-semibold text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
}
function matchesSearch(user: UserSummary, q: string) {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return (
    user.name.toLowerCase().includes(needle) ||
    user.email.toLowerCase().includes(needle) ||
    (user.studentId?.toLowerCase().includes(needle) ?? false) ||
    (user.teacherId?.toLowerCase().includes(needle) ?? false)
  );
}

function matchesStatus(user: UserSummary, status: UserStatusFilter) {
  if (status === "all") return true;
  if (status === "active") return user.isActive !== false;
  return user.isActive === false;
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
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        onStatusChange(userId, e.target.value === "active")
      }
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </GlassSelect>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card bouncy={false} className="p-4 border-slate-200/70 dark:border-zinc-800/80">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", accent)}>
        {value}
      </p>
    </Card>
  );
}

export function StudentManagementView() {
  const { data: session, status: sessionStatus } = useSession();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const activeTab = parseUserTab(get(QueryKey.userTab));
  const statusFilter = parseUserStatus(get(QueryKey.userStatus));
  const classFilter = parseUserClass(get(QueryKey.userClass));

  const sessionRole = session?.user?.role?.toLowerCase() as AppRole | undefined;
  const resolvedRole =
    (currentUser?.role?.toLowerCase() as AppRole | undefined) ??
    sessionRole ??
    "student";
  const [role, setRole] = useState<AppRole | null>(resolvedRole ?? null);
  const [roleLoaded, setRoleLoaded] = useState(
    sessionStatus !== "loading" && !userLoading,
  );
  const [config, setConfig] = useState<UserManagementConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [rows, setRows] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const showStudentList = isTeacher || activeTab === "students";
  const showAllUsersList = isAdmin && activeTab === "all";
  const showStaffTable =
    isAdmin && (activeTab === "teachers" || activeTab === "admins");
  const showPermissions = isAdmin && activeTab === "permissions";
  const showFilters = showStudentList || showAllUsersList || showStaffTable;

  useEffect(() => {
    if (sessionStatus === "loading" || userLoading) return;
    setRole(resolvedRole);
    setRoleLoaded(true);
  }, [sessionStatus, userLoading, resolvedRole]);

  useEffect(() => {
    if (!roleLoaded || role === "student") return;
    let cancelled = false;
    void (async () => {
      setConfigError(null);
      try {
        const data = await userService.getManagementConfig();
        if (!cancelled) setConfig(data);
      } catch {
        if (!cancelled) {
          setConfigError("Could not load page configuration.");
          setConfig(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleLoaded, role]);

  const setActiveTab = useCallback(
    (tab: UserManagementTab) => {
      setParams({
        [QueryKey.userTab]: tab === "all" ? null : tab,
        [QueryKey.userClass]: null,
      });
    },
    [setParams],
  );

  const setStatusFilter = useCallback(
    (status: UserStatusFilter) => {
      setParams({
        [QueryKey.userStatus]: status === "all" ? null : status,
      });
    },
    [setParams],
  );

  const setClassFilter = useCallback(
    (classId: string) => {
      setParams({
        [QueryKey.userClass]: classId === "all" ? null : classId,
      });
    },
    [setParams],
  );

  const loadUsers = useCallback(async () => {
    if (!roleLoaded) return;
    if (role !== "admin" && role !== "teacher") {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      if (showStudentList) {
        const page = await userService.listStudents({
          classId: classFilter,
          search: searchQuery,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "active",
        });
        setRows(page.items);
      } else if (activeTab === "permissions") {
        setRows([]);
      } else {
        const apiRole = roleForTab(activeTab);
        const page = await userService.listUsers({
          ...(apiRole ? { role: apiRole } : {}),
          name: searchQuery.trim() || undefined,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "active",
          size: 200,
        });
        setRows(page.items);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setLoadError("You do not have permission to view students.");
      } else {
        setLoadError("Failed to load students. Please try again.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    roleLoaded,
    role,
    showStudentList,
    activeTab,
    classFilter,
    searchQuery,
    statusFilter,
  ]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredRows = useMemo(() => {
    if (showStudentList) return rows;
    return rows.filter(
      (u) => matchesSearch(u, searchQuery) && matchesStatus(u, statusFilter),
    );
  }, [rows, searchQuery, statusFilter, showStudentList]);

  const stats = useMemo(() => {
    const active = filteredRows.filter((u) => u.isActive !== false).length;
    return {
      total: filteredRows.length,
      active,
      inactive: filteredRows.length - active,
    };
  }, [filteredRows]);

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    if (!config?.actions.canEditStatus) return;
    setStatusSavingId(userId);
    setLoadError(null);
    try {
      await userService.updateStatus(userId, isActive);
      setRows((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive } : u)),
      );
    } catch {
      setLoadError("Could not update user status.");
    } finally {
      setStatusSavingId(null);
    }
  };

  const handleImport = async (file: File) => {
    setImportMessage(null);
    try {
      const result = await userService.importUsers(file);
      setImportMessage(
        `Import complete: ${result.created} created, ${result.failed} failed.`,
      );
      await loadUsers();
    } catch {
      setImportMessage("Import failed. Use a valid CSV or XLSX file.");
    }
  };

  if (!roleLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!role || role === "student") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="glass-panel rounded-2xl p-8 max-w-sm">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Student management is not available for students.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {config?.pageDescription && (
        <p className="shrink-0 text-sm text-muted-foreground -mt-1 mb-1">
          {config.pageDescription}
        </p>
      )}

      {config?.actions.canAdd && (
        <div className="shrink-0 flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            className={cn(glassBtnPrimaryClass, "gap-1.5")}
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
          {config.actions.canImport && (
            <>
              <button
                type="button"
                className={cn(glassBtnSubtleClass, "gap-1.5")}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4" />
                Bulk Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-3 space-y-4">
        {configError && (
          <p className="text-sm text-destructive" role="alert">
            {configError}
          </p>
        )}

        {importMessage && (
          <p className="text-sm text-muted-foreground glass-panel rounded-xl px-4 py-2.5">
            {importMessage}
          </p>
        )}

        {(config?.tabs?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {config!.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as UserManagementTab)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-2xl transition-colors liquid-glass-btn-subtle liquid-glass-btn",
                  activeTab === tab.id
                    ? "text-foreground ring-1 ring-zinc-200/70 dark:ring-white/12"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {showFilters && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Total" value={stats.total} />
              <StatCard
                label="Active"
                value={stats.active}
                accent="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Inactive"
                value={stats.inactive}
                accent="text-muted-foreground"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <GlassSearchInput
                placeholder="Search by name, email, or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {showStudentList && (
                <GlassSelect
                  className="w-full lg:w-auto lg:min-w-[180px]"
                  value={classFilter}
                  disabled={!config}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  {(config?.classFilters ?? []).map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </GlassSelect>
              )}
              <GlassSelect
                className="w-full lg:w-auto lg:min-w-[150px]"
                value={statusFilter}
                disabled={!config}
                onChange={(e) =>
                  setStatusFilter(e.target.value as UserStatusFilter)
                }
              >
                {(config?.statusFilters ?? []).map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </GlassSelect>
            </div>
          </>
        )}

        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}

        {showPermissions ? (
          <UserPermissionsTab />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : showStudentList ? (
          <StudentListTable
            users={filteredRows}
            canEditStatus={config?.actions.canEditStatus ?? false}
            statusSavingId={statusSavingId}
            onStatusChange={(id, active) => void handleStatusChange(id, active)}
            onViewProfile={setProfileStudentId}
          />
        ) : showAllUsersList ? (
          <AllUsersListTable
            users={filteredRows}
            canEditStatus={config?.actions.canEditStatus ?? false}
            statusSavingId={statusSavingId}
            onStatusChange={(id, active) => void handleStatusChange(id, active)}
            onViewProfile={(user) => {
              if (user.role?.toUpperCase() === "STUDENT") {
                setProfileStudentId(user.id);
              }
            }}
          />
        ) : showStaffTable ? (
          <StaffListTable
            users={filteredRows}
            mode={activeTab}
            canEditStatus={config?.actions.canEditStatus ?? false}
            statusSavingId={statusSavingId}
            onStatusChange={(id, active) => void handleStatusChange(id, active)}
          />
        ) : null}
      </div>

      {config?.actions.canAdd && (
        <AddUserDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultRole={
            activeTab === "teachers"
              ? "TEACHER"
              : activeTab === "admins"
                ? "ADMIN"
                : "STUDENT"
          }
          onCreated={() => void loadUsers()}
        />
      )}

      <StudentProfileSheet
        studentId={profileStudentId}
        open={Boolean(profileStudentId)}
        onOpenChange={(open) => !open && setProfileStudentId(null)}
        canEditStatus={config?.actions.canEditStatus ?? false}
        statusSaving={statusSavingId === profileStudentId}
        activeOverride={
          profileStudentId
            ? rows.find((r) => r.id === profileStudentId)?.isActive
            : undefined
        }
        onStatusChange={(id, active) => void handleStatusChange(id, active)}
      />
    </div>
  );
}

function ListTableShell({
  children,
  emptyMessage,
  isEmpty,
}: {
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <div className="glass-panel rounded-2xl py-16 text-center">
        <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Card bouncy={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

function StudentListTable({
  users,
  canEditStatus,
  statusSavingId,
  onStatusChange,
  onViewProfile,
}: {
  users: UserSummary[];
  canEditStatus: boolean;
  statusSavingId: string | null;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onViewProfile: (userId: string) => void;
}) {
  return (
    <ListTableShell isEmpty={users.length === 0} emptyMessage="No students found.">
      <table className="w-full min-w-[720px] text-left border-collapse">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
            <th className="px-5 py-3">Student</th>
            <th className="px-5 py-3">Student ID</th>
            <th className="px-5 py-3">Class</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80 text-[12px]">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors cursor-pointer"
              onClick={() => onViewProfile(user.id)}
            >
              <td className="px-5 py-3.5">
                <UserCell user={user} />
              </td>
              <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                {user.studentId || "—"}
              </td>
              <td className="px-5 py-3.5 text-muted-foreground max-w-[240px]">
                <span className="line-clamp-2">
                  {user.enrolledClasses || "—"}
                </span>
              </td>
              <td
                className="px-5 py-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <EditableStatusCell
                  userId={user.id}
                  isActive={user.isActive}
                  canEdit={canEditStatus}
                  saving={statusSavingId === user.id}
                  onStatusChange={onStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListTableShell>
  );
}

function AllUsersListTable({
  users,
  canEditStatus,
  statusSavingId,
  onStatusChange,
  onViewProfile,
}: {
  users: UserSummary[];
  canEditStatus: boolean;
  statusSavingId: string | null;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onViewProfile: (user: UserSummary) => void;
}) {
  return (
    <ListTableShell isEmpty={users.length === 0} emptyMessage="No users found.">
      <table className="w-full min-w-[760px] text-left border-collapse">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">ID</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80 text-[12px]">
          {users.map((user) => {
            const isStudent = user.role?.toUpperCase() === "STUDENT";
            return (
              <tr
                key={user.id}
                className={cn(
                  "hover:bg-white/25 dark:hover:bg-white/4 transition-colors",
                  isStudent && "cursor-pointer",
                )}
                onClick={() => isStudent && onViewProfile(user)}
              >
                <td className="px-5 py-3.5">
                  <UserCell user={user} />
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {roleLabel(user.role)}
                </td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                  {user.studentId || user.teacherId || "—"}
                </td>
                <td
                  className="px-5 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EditableStatusCell
                    userId={user.id}
                    isActive={user.isActive}
                    canEdit={canEditStatus}
                    saving={statusSavingId === user.id}
                    onStatusChange={onStatusChange}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ListTableShell>
  );
}

function StaffListTable({
  users,
  mode,
  canEditStatus,
  statusSavingId,
  onStatusChange,
}: {
  users: UserSummary[];
  mode: UserManagementTab;
  canEditStatus: boolean;
  statusSavingId: string | null;
  onStatusChange: (userId: string, isActive: boolean) => void;
}) {
  const isTeachers = mode === "teachers";
  const isAdmins = mode === "admins";

  return (
    <ListTableShell isEmpty={users.length === 0} emptyMessage="No users found.">
      <table className="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30">
            <th className="px-5 py-3">
              {isTeachers ? "Teacher" : "Administrator"}
            </th>
            <th className="px-5 py-3">ID</th>
            {isTeachers && (
              <>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Classes</th>
              </>
            )}
            {isAdmins && (
              <>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Last Login</th>
              </>
            )}
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/80 text-[12px]">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-white/25 dark:hover:bg-white/4 transition-colors"
            >
              <td className="px-5 py-3.5">
                <UserCell user={user} />
              </td>
              <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                {user.studentId || user.teacherId || "—"}
              </td>
              {isTeachers && (
                <>
                  <td className="px-5 py-3.5 text-muted-foreground">—</td>
                  <td className="px-5 py-3.5 text-muted-foreground">—</td>
                </>
              )}
              {isAdmins && (
                <>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    Super Admin
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">—</td>
                </>
              )}
              <td className="px-5 py-3.5">
                <EditableStatusCell
                  userId={user.id}
                  isActive={user.isActive}
                  canEdit={canEditStatus}
                  saving={statusSavingId === user.id}
                  onStatusChange={onStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListTableShell>
  );
}
