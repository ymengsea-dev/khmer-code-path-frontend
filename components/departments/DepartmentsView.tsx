"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Loader2, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion/BouncyStagger";
import { departmentService } from "@/lib/services/department-service";
import { facultyService } from "@/lib/services/faculty-service";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/departments";
import type { FacultySummaryDto } from "@/lib/types/faculty-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  DepartmentFormDialog,
  type DepartmentFormValues,
} from "./DepartmentFormDialog";
import { DepartmentCard } from "./DepartmentCard";

export function DepartmentsView() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ?? "student";
  const roleLoaded = !userLoading;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<FacultySummaryDto[]>([]);
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
      const [list, facultyList] = await Promise.all([
        departmentService.listDepartments(),
        facultyService.listFaculties(),
      ]);
      setDepartments(list);
      setFaculties(facultyList);
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
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
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

  const openAddForm = () => {
    setFormMode("add");
    setEditing(null);
    setFormOpen(true);
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
      <div className="glass-panel flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center mx-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl glass-panel-subtle">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Department management is available to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 justify-end">
        <button
          type="button"
          onClick={openAddForm}
          className={cn(glassBtnPrimaryClass, "h-10 shrink-0 gap-1.5 px-4 text-xs font-semibold")}
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error && departments.length === 0 ? (
          <div className="glass-panel rounded-2xl px-6 py-12 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl glass-panel-subtle">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No departments yet</p>
            <button
              type="button"
              onClick={openAddForm}
              className={cn(glassBtnPrimaryClass, "mt-1 h-9 gap-1.5 px-4 text-xs font-semibold")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Department
            </button>
          </div>
        ) : (
          <>
            {error && (
              <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}
            <BouncyStagger className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {departments.map((dept) => (
                <BouncyStaggerItem key={dept.id} enter="simple">
                  <DepartmentCard
                    dept={dept}
                    teachersLabel="Teachers"
                    classesLabel="Classes"
                    onTeachers={() => setFacultyDept(dept)}
                    onEdit={() => {
                      setFormMode("edit");
                      setEditing(dept);
                      setFormOpen(true);
                    }}
                  />
                </BouncyStaggerItem>
              ))}
            </BouncyStagger>
          </>
        )}
      </div>

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={editing}
        faculties={faculties}
        saving={saving}
        onSave={handleSave}
      />

      <Dialog open={Boolean(facultyDept)} onOpenChange={(open) => !open && setFacultyDept(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Teachers — {facultyDept?.name}</DialogTitle>
            <DialogDescription>
              {facultyDept?.teacherCount ?? 0} teachers assigned to this department.
            </DialogDescription>
          </DialogHeader>
          {facultyLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : facultyNames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers listed.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {facultyNames.map((name) => (
                <li key={name} className="font-medium text-foreground">
                  {name}
                </li>
              ))}
            </ul>
          )}
          <p className="pt-2 text-sm text-muted-foreground">
            Head of department:{" "}
            <span className="font-medium text-foreground">{facultyDept?.headOfDept}</span>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
