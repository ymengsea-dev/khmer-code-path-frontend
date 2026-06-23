"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
import { glassBtnPrimaryClass } from "@/components/ui/glass-field";
import { permissionService } from "@/lib/services/permission-service";
import type { PermissionsConfig, RolePermissionState } from "@/lib/types/permissions-api";
import { Badge } from "@/components/ui/badge";

function PermissionRow({
  allowed,
  label,
}: {
  allowed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground/90">
      {allowed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
      )}
      <span>{label}</span>
    </div>
  );
}

function PermissionToggle({
  permission,
  disabled,
  onChange,
}: {
  permission: RolePermissionState;
  disabled?: boolean;
  onChange: (authority: string, granted: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border border-zinc-200/80 dark:border-white/10 p-3 cursor-pointer bg-card/40",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-zinc-300"
        checked={permission.granted}
        disabled={disabled}
        onChange={(e) => onChange(permission.authority, e.target.checked)}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{permission.label}</span>
          {permission.overridden && (
            <Badge variant="outline" className="text-[10px]">
              Custom
            </Badge>
          )}
        </span>
        {permission.description && (
          <span className="block text-xs text-muted-foreground leading-relaxed">
            {permission.description}
          </span>
        )}
      </span>
    </label>
  );
}

function RolePermissionSection({
  title,
  description,
  permissions,
  loading,
  saving,
  actionError,
  saveMessage,
  saveLabel,
  onToggle,
  onSave,
}: {
  title: string;
  description?: string;
  permissions: RolePermissionState[];
  loading: boolean;
  saving: boolean;
  actionError: string | null;
  saveMessage: string | null;
  saveLabel: string;
  onToggle: (authority: string, granted: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Card bouncy={false} className="rounded-2xl border-slate-200/80 dark:border-zinc-800/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-extrabold">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <PermissionToggle
                key={permission.authority}
                permission={permission}
                disabled={saving}
                onChange={onToggle}
              />
            ))}
          </div>
        )}

        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        {saveMessage && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{saveMessage}</p>
        )}

        <button
          type="button"
          disabled={saving || loading || permissions.length === 0}
          onClick={onSave}
          className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saveLabel}
        </button>
      </CardContent>
    </Card>
  );
}

export function PermissionsTab({ config }: { config: PermissionsConfig | null }) {
  const [teacherPermissions, setTeacherPermissions] = useState<RolePermissionState[]>([]);
  const [studentPermissions, setStudentPermissions] = useState<RolePermissionState[]>([]);
  const [publicCoursesEnabled, setPublicCoursesEnabled] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [savingTeachers, setSavingTeachers] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [teacherSaveMessage, setTeacherSaveMessage] = useState<string | null>(null);
  const [studentSaveMessage, setStudentSaveMessage] = useState<string | null>(null);
  const [featuresSaveMessage, setFeaturesSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTeacherPermissions = useCallback(async () => {
    setLoadingTeachers(true);
    setTeacherError(null);
    try {
      const data = await permissionService.getTeacherPermissions();
      setTeacherPermissions(data.permissions ?? []);
    } catch {
      setTeacherError("Could not load teacher permissions.");
      setTeacherPermissions([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const loadStudentPermissions = useCallback(async () => {
    setLoadingStudents(true);
    setStudentError(null);
    try {
      const data = await permissionService.getStudentPermissions();
      setStudentPermissions(data.permissions ?? []);
    } catch {
      setStudentError("Could not load student permissions.");
      setStudentPermissions([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadSchoolFeatures = useCallback(async () => {
    setLoadingFeatures(true);
    setFeaturesError(null);
    try {
      const data = await permissionService.getSchoolFeatures();
      setPublicCoursesEnabled(data.publicCoursesEnabled);
    } catch {
      setFeaturesError("Could not load school features.");
    } finally {
      setLoadingFeatures(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        await Promise.all([
          loadTeacherPermissions(),
          loadStudentPermissions(),
          loadSchoolFeatures(),
        ]);
      } catch {
        if (!cancelled) setLoadError("Could not load permissions.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTeacherPermissions, loadStudentPermissions, loadSchoolFeatures]);

  const handleTeacherToggle = (authority: string, granted: boolean) => {
    setTeacherPermissions((prev) =>
      prev.map((p) => (p.authority === authority ? { ...p, granted, overridden: true } : p)),
    );
    setTeacherSaveMessage(null);
  };

  const handleStudentToggle = (authority: string, granted: boolean) => {
    setStudentPermissions((prev) =>
      prev.map((p) => (p.authority === authority ? { ...p, granted, overridden: true } : p)),
    );
    setStudentSaveMessage(null);
  };

  const handleSaveTeachers = async () => {
    if (teacherPermissions.length === 0) return;
    setSavingTeachers(true);
    setTeacherError(null);
    setTeacherSaveMessage(null);
    try {
      const updated = await permissionService.updateTeacherPermissions({
        permissions: teacherPermissions.map((p) => ({
          authority: p.authority,
          granted: p.granted,
        })),
      });
      setTeacherPermissions(updated.permissions ?? []);
      setTeacherSaveMessage("Teacher permissions saved.");
    } catch (err) {
      setTeacherError(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string } | undefined)?.message ??
            "Could not save teacher permissions.")
          : "Could not save teacher permissions.",
      );
    } finally {
      setSavingTeachers(false);
    }
  };

  const handleSaveStudents = async () => {
    if (studentPermissions.length === 0) return;
    setSavingStudents(true);
    setStudentError(null);
    setStudentSaveMessage(null);
    try {
      const updated = await permissionService.updateStudentPermissions({
        permissions: studentPermissions.map((p) => ({
          authority: p.authority,
          granted: p.granted,
        })),
      });
      setStudentPermissions(updated.permissions ?? []);
      setStudentSaveMessage("Student permissions saved.");
    } catch (err) {
      setStudentError(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string } | undefined)?.message ??
            "Could not save student permissions.")
          : "Could not save student permissions.",
      );
    } finally {
      setSavingStudents(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSavingFeatures(true);
    setFeaturesError(null);
    setFeaturesSaveMessage(null);
    try {
      const updated = await permissionService.updateSchoolFeatures({
        publicCoursesEnabled,
      });
      setPublicCoursesEnabled(updated.publicCoursesEnabled);
      setFeaturesSaveMessage("School features saved.");
    } catch (err) {
      setFeaturesError(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string } | undefined)?.message ??
            "Could not save school features.")
          : "Could not save school features.",
      );
    } finally {
      setSavingFeatures(false);
    }
  };

  const roleSummaries = config?.roleSummaries ?? [];
  const saveLabel = config?.saveButtonLabel ?? "Save permissions";

  if (loadingTeachers && loadingStudents && loadingFeatures) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          {loadError}
        </p>
      )}

      <BouncyStagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roleSummaries.map((role) => (
          <BouncyStaggerItem key={role.role} enter="simple">
            <Card bouncy={false} className="border-slate-200/80 dark:border-zinc-800/80 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-extrabold">{role.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </CardHeader>
              <CardContent className="grid gap-2 pt-0">
                {role.highlights.map((p) => (
                  <PermissionRow key={p.label} allowed={p.granted} label={p.label} />
                ))}
              </CardContent>
            </Card>
          </BouncyStaggerItem>
        ))}
      </BouncyStagger>

      <Card bouncy={false} className="rounded-2xl border-slate-200/80 dark:border-zinc-800/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold">
            {config?.schoolFeaturesSectionTitle ?? "School features"}
          </CardTitle>
          {config?.schoolFeaturesSectionDescription && (
            <p className="text-xs text-muted-foreground">{config.schoolFeaturesSectionDescription}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {loadingFeatures ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <label
              className={cn(
                "flex items-start gap-3 rounded-xl border border-zinc-200/80 dark:border-white/10 p-3 cursor-pointer bg-card/40 max-w-xl",
                savingFeatures && "opacity-60 cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                checked={publicCoursesEnabled}
                disabled={savingFeatures}
                onChange={(e) => {
                  setPublicCoursesEnabled(e.target.checked);
                  setFeaturesSaveMessage(null);
                }}
              />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="text-sm font-semibold text-foreground">
                  {config?.publicCoursesFeatureLabel ?? "Public courses"}
                </span>
                {config?.publicCoursesFeatureDescription && (
                  <span className="block text-xs text-muted-foreground leading-relaxed">
                    {config.publicCoursesFeatureDescription}
                  </span>
                )}
              </span>
            </label>
          )}

          {featuresError && <p className="text-sm text-destructive">{featuresError}</p>}
          {featuresSaveMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{featuresSaveMessage}</p>
          )}

          <button
            type="button"
            disabled={savingFeatures || loadingFeatures}
            onClick={() => void handleSaveFeatures()}
            className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
          >
            {savingFeatures ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saveLabel}
          </button>
        </CardContent>
      </Card>

      <RolePermissionSection
        title={config?.teacherSectionTitle ?? "Teacher permissions"}
        description={config?.teacherSectionDescription}
        permissions={teacherPermissions}
        loading={loadingTeachers}
        saving={savingTeachers}
        actionError={teacherError}
        saveMessage={teacherSaveMessage}
        saveLabel={saveLabel}
        onToggle={handleTeacherToggle}
        onSave={() => void handleSaveTeachers()}
      />

      <RolePermissionSection
        title={config?.studentSectionTitle ?? "Student permissions"}
        description={config?.studentSectionDescription}
        permissions={studentPermissions}
        loading={loadingStudents}
        saving={savingStudents}
        actionError={studentError}
        saveMessage={studentSaveMessage}
        saveLabel={saveLabel}
        onToggle={handleStudentToggle}
        onSave={() => void handleSaveStudents()}
      />
    </div>
  );
}
