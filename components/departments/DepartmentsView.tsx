"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Users, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { departmentService } from "@/lib/services/department-service";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/departments";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  DepartmentFormDialog,
  type DepartmentFormValues,
} from "./DepartmentFormDialog";

const ACCENT_BAR: Record<Department["accent"], string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

const ACCENT_FILL: Record<Department["accent"], string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

function DepartmentCard({
  dept,
  onFaculty,
  onEdit,
}: {
  dept: Department;
  onFaculty: () => void;
  onEdit: () => void;
}) {
  const isActive = dept.status === "active";

  return (
    <Card className="overflow-hidden border-slate-200/80 dark:border-zinc-800 shadow-2xs p-0 gap-0">
      <AccentBar accent={dept.accent} />
      <div className="p-6">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">{dept.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dept.faculty}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold shrink-0",
              isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-slate-500/30 bg-slate-500/10 text-muted-foreground",
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <DeptStats dept={dept} />

        <div className="rounded-lg bg-slate-50/80 dark:bg-zinc-950/50 border border-slate-200/50 dark:border-zinc-800/80 p-3 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Resource Utilization
          </p>
          <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                ACCENT_FILL[dept.accent],
              )}
              style={{ width: `${dept.capacityPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {dept.capacityPercent}% Capacity
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onFaculty}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Faculty
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AccentBar({ accent }: { accent: Department["accent"] }) {
  return <div className={cn("h-2", ACCENT_BAR[accent])} />;
}

function DeptStats({ dept }: { dept: Department }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Head of Dept
        </p>
        <p className="text-sm font-semibold text-foreground">
          {dept.headOfDept}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Faculty Count
        </p>
        <p className="text-sm font-semibold text-foreground">
          {dept.facultyCount} {dept.facultyCount === 1 ? "Teacher" : "Teachers"}
        </p>
      </div>
    </div>
  );
}

export function DepartmentsView() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ??
    "student";
  const roleLoaded = !userLoading;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const [facultyDept, setFacultyDept] = useState<Department | null>(null);
  const [facultyNames, setFacultyNames] = useState<string[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await departmentService.listDepartments();
      setDepartments(list);
    } catch {
      setError("Could not load departments. Try signing in again as admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roleLoaded && role === "admin") {
      void loadDepartments();
    } else if (roleLoaded) {
      setLoading(false);
    }
  }, [roleLoaded, role, loadDepartments]);

  useEffect(() => {
    if (!facultyDept) {
      setFacultyNames([]);
      return;
    }
    let cancelled = false;
    async function loadFaculty() {
      setFacultyLoading(true);
      try {
        const detail = await departmentService.getDepartment(facultyDept!.id);
        if (!cancelled) {
          setFacultyNames(detail.assignedTeachers ?? []);
        }
      } catch {
        if (!cancelled) setFacultyNames([]);
      } finally {
        if (!cancelled) setFacultyLoading(false);
      }
    }
    void loadFaculty();
    return () => {
      cancelled = true;
    };
  }, [facultyDept]);

  const handleSave = async (values: DepartmentFormValues) => {
    setSaving(true);
    setError(null);
    try {
      if (formMode === "edit" && editing) {
        const updated = await departmentService.updateDepartment(
          editing.id,
          departmentService.buildUpdatePayload(values),
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
      } else {
        const created = await departmentService.createDepartment(
          departmentService.buildCreatePayload(values),
        );
        setDepartments((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch {
      setError("Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  if (!roleLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Department management is available to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/60 dark:border-zinc-800 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader />
        <Button
          size="sm"
          onClick={() => {
            setFormMode("add");
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Department
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error && departments.length === 0 ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No departments yet. Add your first department to get started.
          </p>
        ) : (
          <>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {departments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  onFaculty={() => setFacultyDept(dept)}
                  onEdit={() => {
                    setFormMode("edit");
                    setEditing(dept);
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={editing}
        saving={saving}
        onSave={handleSave}
      />

      <Dialog
        open={Boolean(facultyDept)}
        onOpenChange={(open) => !open && setFacultyDept(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Faculty — {facultyDept?.name}</DialogTitle>
            <DialogDescription>
              {facultyDept?.facultyCount ?? 0} teachers in this department.
            </DialogDescription>
          </DialogHeader>
          {facultyLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          ) : facultyNames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers listed.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {facultyNames.map((name) => (
                <li key={name} className="font-medium text-foreground">
                  {name}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground pt-2">
            Head of department:{" "}
            <span className="font-medium text-foreground">
              {facultyDept?.headOfDept}
            </span>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        Department Management
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Organize academic units, faculty heads, and resource allocation.
      </p>
    </div>
  );
}
