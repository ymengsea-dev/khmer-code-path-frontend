"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  GlassInput,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import {
  buildRegistrationUrl,
  schoolService,
} from "@/lib/services/school-service";
import { getApiErrorMessage } from "@/lib/api-error";
import type { SchoolConfig, SchoolDetail } from "@/lib/types/school-api";
import { cn } from "@/lib/utils";

function glassPanelStyle() {
  return {
    background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    border: "1px solid var(--glass-border-color)",
  } as const;
}

/** School registration settings — shown under Settings for administrators. */
export function SchoolProfileSection() {
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    slug: "",
    registrationOpen: true,
  });

  const profileConfig = config?.profile;

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configResult, schoolResult] = await Promise.allSettled([
        schoolService.getSchoolConfig(),
        schoolService.getMySchool(),
      ]);

      if (configResult.status === "fulfilled") {
        setConfig(configResult.value);
      }
      if (schoolResult.status === "fulfilled") {
        const schoolData = schoolResult.value;
        setSchool(schoolData);
        setProfileForm({
          name: schoolData.name,
          slug: schoolData.slug,
          registrationOpen: schoolData.registrationOpen,
        });
      }

      if (configResult.status === "rejected" && schoolResult.status === "rejected") {
        setError("Could not load school settings.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      const updated = await schoolService.updateMySchool({
        name: profileForm.name.trim(),
        slug: profileForm.slug.trim(),
        registrationOpen: profileForm.registrationOpen,
      });
      setSchool(updated);
      setProfileForm({
        name: updated.name,
        slug: updated.slug,
        registrationOpen: updated.registrationOpen,
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not update school settings."));
    } finally {
      setSavingProfile(false);
    }
  };

  const registrationUrl = useMemo(() => {
    const slug = profileForm.slug || school?.slug;
    if (!slug) return school?.registrationUrl ?? "";
    const path =
      school?.registrationPath ??
      `${profileConfig?.registrationPathPrefix ?? "/register/"}${slug}`;
    return buildRegistrationUrl(path, school?.registrationUrl);
  }, [school, profileForm.slug, profileConfig?.registrationPathPrefix]);

  const handleCopyRegistrationUrl = async () => {
    if (!registrationUrl) return;
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setError("Could not copy registration link.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          {error}
        </p>
      )}

      <Card bouncy={false} className="rounded-2xl p-5 space-y-4 max-w-xl" style={glassPanelStyle()}>
        <h2 className="text-sm font-extrabold text-foreground">
          {profileConfig?.profileSectionTitle ?? "School registration"}
        </h2>
        {profileConfig?.profileSectionDescription ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {profileConfig.profileSectionDescription}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            {profileConfig?.registrationUrlLabel ?? "Registration link"}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GlassInput readOnly value={registrationUrl} className="font-mono text-xs" />
            <button
              type="button"
              disabled={!registrationUrl}
              onClick={() => void handleCopyRegistrationUrl()}
              className={cn(glassBtnSubtleClass, "h-11 px-4 text-xs font-semibold gap-1.5 shrink-0")}
            >
              {copiedUrl ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {profileConfig?.copiedUrlMessage ?? "Link copied!"}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {profileConfig?.copyUrlLabel ?? "Copy link"}
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {profileConfig?.nameLabel ?? "School name"}
            </Label>
            <GlassInput
              value={profileForm.name}
              onChange={(e) => setProfileForm((c) => ({ ...c, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {profileConfig?.slugLabel ?? "Registration slug"}
            </Label>
            <GlassInput
              value={profileForm.slug}
              onChange={(e) => setProfileForm((c) => ({ ...c, slug: e.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300"
              checked={profileForm.registrationOpen}
              onChange={(e) =>
                setProfileForm((c) => ({ ...c, registrationOpen: e.target.checked }))
              }
            />
            {profileConfig?.registrationOpenLabel ?? "Registration open"}
          </label>
          <button
            type="submit"
            disabled={savingProfile}
            className={cn(glassBtnPrimaryClass, "h-9 px-4 text-xs font-semibold gap-1.5")}
          >
            {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {profileConfig?.saveProfileLabel ?? "Save profile"}
          </button>
        </form>
      </Card>
    </div>
  );
}
