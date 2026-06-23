"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  GlassInput,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { GlassButton } from "@/components/ui/glass-button";
import { getApiErrorMessage } from "@/lib/api-error";
import { facultyService } from "@/lib/services/faculty-service";
import type { FacultyConfigDto, FacultySummaryDto } from "@/lib/types/faculty-api";
import { cn } from "@/lib/utils";
import { FacultyCoverBanner } from "./FacultyCoverBanner";

function glassPanelStyle() {
  return {
    background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    border: "1px solid var(--glass-border-color)",
  } as const;
}

interface FacultyDetailViewProps {
  facultyId: string | null;
  onBack: () => void;
  onFacultyNameLoaded?: (name: string) => void;
}

export function FacultyDetailView({
  facultyId,
  onBack,
  onFacultyNameLoaded,
}: FacultyDetailViewProps) {
  const [config, setConfig] = useState<FacultyConfigDto | null>(null);
  const [faculty, setFaculty] = useState<FacultySummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({ name: "", tagline: "" });

  const parsedId = facultyId ? Number(facultyId) : NaN;

  const loadCore = useCallback(async () => {
    if (!facultyId || Number.isNaN(parsedId)) {
      setLoading(false);
      setFaculty(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cfg, list] = await Promise.all([
        facultyService.getConfig(),
        facultyService.listFaculties(),
      ]);
      setConfig(cfg);
      const match = list.find((item) => item.id === parsedId) ?? null;
      setFaculty(match);
      if (match) {
        setProfileForm({
          name: match.name,
          tagline: match.tagline ?? "",
        });
        onFacultyNameLoaded?.(match.name);
      } else {
        setError("Faculty not found.");
      }
    } catch {
      setError("Could not load faculty.");
      setFaculty(null);
    } finally {
      setLoading(false);
    }
  }, [facultyId, parsedId, onFacultyNameLoaded]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!faculty) return;
    setSavingProfile(true);
    setError(null);
    try {
      const updated = await facultyService.updateFaculty(faculty.id, {
        name: profileForm.name.trim(),
        tagline: profileForm.tagline.trim() || null,
      });
      setFaculty(updated);
      setProfileForm({
        name: updated.name,
        tagline: updated.tagline ?? "",
      });
      onFacultyNameLoaded?.(updated.name);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not update faculty profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!faculty) return;
    setUploadingCover(true);
    setError(null);
    try {
      const updated = await facultyService.uploadCover(faculty.id, file);
      setFaculty(updated);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not upload cover image."));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!faculty) return;
    setRemovingCover(true);
    setError(null);
    try {
      const updated = await facultyService.removeCover(faculty.id);
      setFaculty(updated);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not remove cover image."));
    } finally {
      setRemovingCover(false);
    }
  };

  const gradients = config?.cardGradients ?? [];
  const cardGradient = gradients[0] ?? "from-indigo-500 to-purple-600";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-destructive">{error ?? "Faculty not found."}</p>
        <GlassButton subtle className="h-9 px-4 text-xs font-semibold" onClick={onBack}>
          {config?.backToFacultiesLabel ?? "Back to faculties"}
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <button
          type="button"
          aria-label={config?.backToFacultiesLabel ?? "Back to faculties"}
          onClick={onBack}
          className={cn(
            glassBtnSubtleClass,
            "liquid-glass-btn-subtle liquid-glass-btn inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {config?.backToFacultiesLabel ?? "Back to faculties"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-4">
        {error && (
          <p className="mb-4 text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <Card bouncy={false} className="rounded-2xl p-5 space-y-4 h-full" style={glassPanelStyle()}>
            <h2 className="text-sm font-extrabold text-foreground">
              {config?.configureDialogTitle ?? "Faculty profile"}
            </h2>
            {config?.configureDialogDescription ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {config.configureDialogDescription}
              </p>
            ) : null}

            <div className="glass-panel-subtle rounded-xl p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {config?.departmentCountLabel ?? "Departments"}
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                {faculty.departmentCount}
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {config?.nameLabel ?? "Faculty name"}
                </Label>
                <GlassInput
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((c) => ({ ...c, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {config?.taglineLabel ?? "Tagline"}
                </Label>
                <GlassInput
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm((c) => ({ ...c, tagline: e.target.value }))}
                  placeholder={config?.taglinePlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
              >
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {config?.saveButtonLabel ?? "Save"}
              </button>
            </form>
          </Card>

          <Card
            bouncy={false}
            className="rounded-2xl p-5 space-y-4 h-full flex flex-col"
            style={glassPanelStyle()}
          >
            <div>
              <h2 className="text-sm font-extrabold text-foreground">
                {config?.coverImageLabel ?? "Cover image"}
              </h2>
              {config?.coverImageDescription && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {config.coverImageDescription}
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-white/10 flex-1 min-h-[10rem]">
          <FacultyCoverBanner
            facultyId={faculty.id}
            coverUrl={faculty.coverUrl}
            gradient={cardGradient}
            name={faculty.name}
            tagline={faculty.tagline}
            status={faculty.status}
            variant="detail"
          />
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleCoverUpload(file);
                e.target.value = "";
              }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
              >
                {uploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {config?.uploadCoverLabel ?? "Upload cover"}
              </button>
              {faculty.coverUrl && (
                <button
                  type="button"
                  disabled={removingCover}
                  onClick={() => void handleRemoveCover()}
                  className={cn(glassBtnSubtleClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
                >
                  {removingCover && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {config?.removeCoverLabel ?? "Remove cover"}
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
