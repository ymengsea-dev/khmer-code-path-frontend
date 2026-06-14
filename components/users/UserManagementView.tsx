"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Search,
  UserPlus,
  FileUp,
  Pencil,
  Loader2,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import {
  userService,
  type UserSummary,
} from "@/lib/services/user-service";
import { cn } from "@/lib/utils";
import { useDebouncedQueryState } from "@/lib/hooks/use-debounced-query-state";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import {
  QueryKey,
  parseUserTab,
  parseUserStatus,
  type UserManagementTab,
  type UserStatusFilter,
} from "@/lib/navigation/app-query";
import { AddUserDialog } from "./AddUserDialog";
import { UserPermissionsTab } from "./UserPermissionsTab";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type AppRole = "student" | "teacher" | "admin";

const ADMIN_TABS: { id: UserManagementTab; label: string }[] = [
  { id: "all", label: "All Users" },
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "admins", label: "Administrators" },
  { id: "permissions", label: "Roles & Permissions" },
];

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

function avatarUrl(name: string) {
  const encoded = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${encoded}&background=8b5cf6&color=fff&size=64`;
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

function UserCell({ user }: { user: UserSummary }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={avatarUrl(user.name)}
        alt=""
        className="h-8 w-8 rounded-full shrink-0"
      />
      <div className="min-w-0">
        <p className="font-semibold text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
        "text-[11px] font-semibold",
        isActive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-slate-500/30 bg-slate-500/10 text-muted-foreground"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function UserManagementView() {
  const { data: session, status: sessionStatus } = useSession();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { get, setParams } = useQueryParams();
  const [searchQuery, setSearchQuery] = useDebouncedQueryState(QueryKey.q);
  const activeTab = parseUserTab(get(QueryKey.userTab));
  const statusFilter = parseUserStatus(get(QueryKey.userStatus));

  const sessionRole = session?.user?.role?.toLowerCase() as AppRole | undefined;
  const resolvedRole =
    (currentUser?.role?.toLowerCase() as AppRole | undefined) ?? sessionRole ?? "student";
  const [role, setRole] = useState<AppRole | null>(resolvedRole ?? null);
  const [roleLoaded, setRoleLoaded] = useState(sessionStatus !== "loading" && !userLoading);
  const [rows, setRows] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserSummary | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  useEffect(() => {
    if (sessionStatus === "loading" || userLoading) return;
    setRole(resolvedRole);
    setRoleLoaded(true);
  }, [sessionStatus, userLoading, resolvedRole]);

  const setActiveTab = useCallback(
    (tab: UserManagementTab) => {
      setParams({ [QueryKey.userTab]: tab === "all" ? null : tab });
    },
    [setParams]
  );

  const setStatusFilter = useCallback(
    (status: UserStatusFilter) => {
      setParams({
        [QueryKey.userStatus]: status === "all" ? null : status,
      });
    },
    [setParams]
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
      if (isTeacher) {
        const students = await userService.listTeacherStudents();
        setRows(students);
      } else if (activeTab === "permissions") {
        setRows([]);
      } else {
        const apiRole = roleForTab(activeTab);
        const page = await userService.listUsers({
          ...(apiRole ? { role: apiRole } : {}),
          name: searchQuery.trim() || undefined,
          isActive:
            statusFilter === "all"
              ? undefined
              : statusFilter === "active",
          size: 200,
        });
        setRows(page.items);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setLoadError("You do not have permission to view users.");
      } else {
        setLoadError("Failed to load users. Please try again.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    roleLoaded,
    role,
    isTeacher,
    activeTab,
    searchQuery,
    statusFilter,
  ]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (u) => matchesSearch(u, searchQuery) && matchesStatus(u, statusFilter)
    );
  }, [rows, searchQuery, statusFilter]);

  const handleToggleStatus = async () => {
    if (!editUser || !isAdmin) return;
    setStatusSaving(true);
    try {
      await userService.updateStatus(
        editUser.id,
        editUser.isActive === false
      );
      setEditUser(null);
      await loadUsers();
    } catch {
      setLoadError("Could not update user status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleImport = async (file: File) => {
    setImportMessage(null);
    try {
      const result = await userService.importUsers(file);
      setImportMessage(
        `Import complete: ${result.created} created, ${result.failed} failed.`
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
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          User management is not available for students.
        </p>
      </div>
    );
  }

  const showTable = isTeacher || activeTab !== "permissions";

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/60 dark:border-zinc-800 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Students enrolled in your classes."
              : "Manage institution-wide identity and access control."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add User
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4 mr-1.5" />
              Bulk Import
            </Button>
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
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {importMessage && (
          <p className="text-sm text-muted-foreground rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-2">
            {importMessage}
          </p>
        )}

        {isAdmin && (
          <div className="flex flex-wrap gap-1.5 border-b border-border/40 pb-3">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-2xl transition-colors",
                  activeTab === tab.id
                    ? "bg-white/42 text-foreground ring-1 ring-zinc-200/60 dark:bg-white/8 dark:ring-white/10"
                    : "text-muted-foreground hover:bg-white/22 dark:hover:bg-white/6 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {showTable && (
          <Card className="p-4 border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm min-w-[140px]"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as UserStatusFilter)
                }
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </Card>
        )}

        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}

        {activeTab === "permissions" && isAdmin ? (
          <UserPermissionsTab />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <UserTable
            users={filteredRows}
            mode={isTeacher ? "teacher-students" : activeTab}
            isAdmin={isAdmin}
            onEdit={setEditUser}
          />
        )}
      </div>

      {isAdmin && (
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

      <Dialog open={Boolean(editUser)} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              {editUser?.name} — toggle account status.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <p className="text-sm text-muted-foreground">
              Current status:{" "}
              <StatusBadge active={editUser.isActive} />
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleToggleStatus()}
              disabled={statusSaving}
            >
              {statusSaving
                ? "Saving…"
                : editUser?.isActive !== false
                  ? "Deactivate"
                  : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTable({
  users,
  mode,
  isAdmin,
  onEdit,
}: {
  users: UserSummary[];
  mode: UserManagementTab | "teacher-students";
  isAdmin: boolean;
  onEdit: (user: UserSummary) => void;
}) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No users found.
      </p>
    );
  }

  const isAll = mode === "all";
  const isStudents =
    mode === "students" || mode === "teacher-students";
  const isTeachers = mode === "teachers";
  const isAdmins = mode === "admins";

  return (
    <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
              <th className="px-5 py-3">
                {isAll
                  ? "User"
                  : isStudents
                    ? "Student"
                    : isTeachers
                      ? "Teacher"
                      : "Administrator"}
              </th>
              {isAll && <th className="px-5 py-3">Role</th>}
              <th className="px-5 py-3">ID</th>
              {isStudents && (
                <th className="px-5 py-3">
                  {mode === "teacher-students" ? "Classes" : "Program"}
                </th>
              )}
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
              {isAdmin && <th className="px-5 py-3 w-16">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-[12px]">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-100/30 dark:hover:bg-zinc-900/25 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <UserCell user={user} />
                </td>
                {isAll && (
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {roleLabel(user.role)}
                  </td>
                )}
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                  {user.studentId || user.teacherId || "—"}
                </td>
                {isStudents && (
                  <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">
                    {user.enrolledClasses || "—"}
                  </td>
                )}
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
                  <StatusBadge active={user.isActive} />
                </td>
                {isAdmin && (
                  <td className="px-5 py-3.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(user)}
                      aria-label={`Edit ${user.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
