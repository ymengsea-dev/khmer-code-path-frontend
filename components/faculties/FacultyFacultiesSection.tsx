"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2, Plus } from "lucide-react";
import {
  GlassSearchInput,
  glassBtnPrimaryClass,
} from "@/components/ui/glass-field";
import { BouncyStagger, BouncyStaggerItem } from "@/components/motion/BouncyStagger";
import { facultyService } from "@/lib/services/faculty-service";
import type { FacultyConfigDto, FacultySummaryDto } from "@/lib/types/faculty-api";
import { cn } from "@/lib/utils";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { FacultyAddDialog } from "./FacultyAddDialog";
import { FacultyCard } from "./FacultyCard";

export function FacultyFacultiesSection() {
  const { setParams } = useQueryParams();
  const [config, setConfig] = useState<FacultyConfigDto | null>(null);
  const [faculties, setFaculties] = useState<FacultySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const openFacultyDetail = useCallback(
    (id: number) => {
      setParams({
        [QueryKey.view]: "faculty-detail",
        [QueryKey.faculty]: String(id),
      });
    },
    [setParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfg, list] = await Promise.all([
        facultyService.getConfig(),
        facultyService.listFaculties(),
      ]);
      setConfig(cfg);
      setFaculties(list);
    } catch {
      setError("Could not load faculties.");
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (name: string) => {
    setSaving(true);
    setError(null);
    try {
      const created = await facultyService.createFaculty({ name });
      setFaculties((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: unknown) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const gradients = config?.cardGradients ?? [];
  const gradientFor = (index: number) =>
    gradients[index % Math.max(gradients.length, 1)] ?? "from-indigo-500 to-purple-600";

  const filteredFaculties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return faculties;
    return faculties.filter((faculty) => {
      const haystack = [faculty.name, faculty.tagline ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [faculties, searchQuery]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <GlassSearchInput
          size="sm"
          containerClassName="flex-1"
          className="h-10"
          placeholder={config?.searchPlaceholder ?? "Search faculties…"}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className={cn(
            glassBtnPrimaryClass,
            "h-10 shrink-0 gap-1.5 px-4 text-xs font-semibold sm:w-auto w-full",
          )}
        >
          <Plus className="h-4 w-4" />
          {config?.addButtonLabel ?? "Add faculty"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error && faculties.length === 0 ? (
          <div className="glass-panel rounded-2xl px-6 py-12 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : faculties.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl glass-panel-subtle">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {config?.emptyMessage ?? "No faculties yet."}
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={cn(glassBtnPrimaryClass, "mt-1 h-9 gap-1.5 px-4 text-xs font-semibold")}
            >
              <Plus className="h-3.5 w-3.5" />
              {config?.addButtonLabel ?? "Add faculty"}
            </button>
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="glass-panel rounded-2xl px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {config?.noResultsMessage ?? "No faculties match your search."}
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}
            <BouncyStagger className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFaculties.map((faculty) => {
                const sourceIndex = faculties.findIndex((f) => f.id === faculty.id);
                return (
                  <BouncyStaggerItem key={faculty.id} enter="simple">
                    <FacultyCard
                      faculty={faculty}
                      config={config}
                      gradient={gradientFor(sourceIndex >= 0 ? sourceIndex : 0)}
                      onOpen={() => openFacultyDetail(faculty.id)}
                    />
                  </BouncyStaggerItem>
                );
              })}
            </BouncyStagger>
          </>
        )}
      </div>

      <FacultyAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        config={config}
        saving={saving}
        onAdd={handleAdd}
      />
    </div>
  );
}
