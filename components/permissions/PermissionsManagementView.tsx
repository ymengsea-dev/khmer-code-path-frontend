"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { permissionService } from "@/lib/services/permission-service";
import type { PermissionsConfig } from "@/lib/types/permissions-api";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import {
  QueryKey,
  parsePermissionsTab,
  type RolesPermissionsTab,
} from "@/lib/navigation/app-query";
import { cn } from "@/lib/utils";
import { RolesTab } from "./RolesTab";
import { PermissionsTab } from "./PermissionsTab";

export function PermissionsManagementView() {
  const { searchParams, setParams } = useQueryParams();
  const activeTab = parsePermissionsTab(searchParams.get(QueryKey.permissionsTab));

  const [config, setConfig] = useState<PermissionsConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setConfigError(null);

    void permissionService
      .getConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfigError("Could not load roles & permissions configuration.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = config?.tabs ?? [];

  const handleTabChange = (tab: RolesPermissionsTab) => {
    setParams({ [QueryKey.permissionsTab]: tab === "roles" ? null : tab });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-4">
        {configError && (
          <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 mb-4">
            {configError}
          </p>
        )}

        {tabs.length > 0 && (
          <div
            className={cn(
              "sticky top-0 z-10 -mx-5 px-5 pb-3 mb-4",
              "bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70",
              "border-b border-zinc-200/50 dark:border-white/8",
            )}
          >
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as RolesPermissionsTab)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-2xl transition-colors",
                    activeTab === tab.id
                      ? "glass-btn-primary text-white shadow-sm"
                      : "liquid-glass-btn-subtle liquid-glass-btn text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {activeTab === "roles" && <RolesTab config={config} />}
          {activeTab === "permissions" && <PermissionsTab config={config} />}
        </div>
      </div>
    </div>
  );
}
