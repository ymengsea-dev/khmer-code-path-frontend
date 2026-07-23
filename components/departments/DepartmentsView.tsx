"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Loader2, GraduationCap } from "lucide-react";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion/BouncyStagger";
import { departmentService } from "@/lib/services/department-service";
import { facultyService } from "@/lib/services/faculty-service";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/departments";
import type { FacultySummaryDto } from "@/lib/types/faculty-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import {
  DepartmentFormDialog,
  type DepartmentFormValues,
} from "./DepartmentFormDialog";
import { DepartmentCard } from "./DepartmentCard";

export function DepartmentsView() {
  const { setParams } = useQueryParams();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ?? "student";
  const roleLoaded = !userLoading;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<FacultySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openDetail = useCallback(
    (id: number) => {
      setParams({
        [QueryKey.view]: "department-detail",
        [QueryKey.department]: String(id),
      });
    },
    [setParams],
  );

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

  const handleCreateSave = async (values: DepartmentFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const created = await departmentService.createDepartment(
        departmentService.buildCreatePayload(values),
      );
      setDepartments((prev) => [...prev, created]);
      setFormOpen(false);
      openDetail(created.id);
    } catch {
      setError("Failed to create department.");
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
          onClick={() => setFormOpen(true)}
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
              onClick={() => setFormOpen(true)}
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
                    onTeachers={() => openDetail(dept.id)}
                    onEdit={() => openDetail(dept.id)}
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
        mode="add"
        faculties={faculties}
        saving={saving}
        onSave={handleCreateSave}
      />
    </div>
  );
}
