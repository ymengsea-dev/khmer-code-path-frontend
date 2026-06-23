"use client";

import { useEffect, useState } from "react";
import { Building2, ChevronRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { facultyService } from "@/lib/services/faculty-service";
import type { FacultyStatusDto } from "@/lib/types/faculty-api";

export function FacultyCoverBanner({
  facultyId,
  coverUrl,
  gradient,
  name,
  tagline,
  status,
  departmentCount,
  departmentLabel,
  variant = "detail",
}: {
  facultyId: number;
  coverUrl?: string | null;
  gradient: string;
  name?: string;
  tagline?: string | null;
  status?: FacultyStatusDto;
  departmentCount?: number;
  departmentLabel?: string;
  variant?: "card" | "detail";
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const isActive = status !== "INACTIVE";
  const isCard = variant === "card";

  useEffect(() => {
    if (!coverUrl) {
      setBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void facultyService.fetchCoverBlobUrl(facultyId).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setBlobUrl(url);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [facultyId, coverUrl]);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-end overflow-hidden bg-gradient-to-br",
        isCard ? "aspect-[4/3] min-h-[11rem]" : "h-40 px-5 pb-5 pt-4",
        !isCard && "px-5 pb-5 pt-4",
        !blobUrl && gradient,
      )}
    >
      {blobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
            isCard && "group-hover:scale-[1.04]",
          )}
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-0",
          isCard
            ? "bg-gradient-to-t from-black/85 via-black/35 to-black/10"
            : "bg-black/20",
        )}
      />

      <GraduationCap
        className={cn(
          "pointer-events-none absolute text-white/10",
          isCard ? "right-2 top-1/2 h-24 w-24 -translate-y-1/2 rotate-12" : "-right-3 -bottom-6 h-32 w-32 rotate-12",
        )}
      />

      {isCard ? (
        <>
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3.5">
            <span className="rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
              Faculty
            </span>
            {status ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
                  isActive
                    ? "bg-emerald-500/90 text-white"
                    : "bg-white/15 text-white/90 ring-1 ring-white/25",
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            ) : null}
          </div>

          <div className="relative z-10 space-y-2.5 p-4 pt-0">
            {name ? (
              <div className="min-w-0 space-y-1 pr-8">
                <h3 className="line-clamp-2 text-[17px] font-extrabold leading-snug text-white drop-shadow-sm">
                  {name}
                </h3>
                {tagline ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-white/80">{tagline}</p>
                ) : null}
              </div>
            ) : null}

            {departmentCount != null && departmentLabel ? (
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                  <Building2 className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
                  <span className="tabular-nums">{departmentCount}</span>
                  <span className="opacity-90">{departmentLabel.toLowerCase()}</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="relative z-10 flex items-start justify-between gap-2">
            <span className="rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95">
              Faculty
            </span>
            {status ? (
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isActive
                    ? "bg-emerald-500/90 text-white"
                    : "bg-white/20 text-white/90 ring-1 ring-white/25",
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            ) : null}
          </div>

          {name ? (
            <div className="relative z-10 mt-auto">
              <h3 className="text-lg font-extrabold leading-tight text-white drop-shadow-sm">{name}</h3>
              {tagline ? (
                <p className="mt-0.5 line-clamp-2 text-xs font-medium text-white/85">{tagline}</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
