"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Loader2,
  Plus,
  Video,
  Laptop,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operationsService } from "@/lib/services/operations-service";
import { cn } from "@/lib/utils";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import {
  QueryKey,
  parseOpsTab,
  type OperationsTab,
} from "@/lib/navigation/app-query";
import type {
  PhysicalAsset,
  TeacherRequest,
  InfraBadgeVariant,
  AssetStatus,
  InfraStatusRow,
} from "@/data/operations";
import { AddAssetDialog, type AssetFormValues } from "./AddAssetDialog";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const OPS_TABS: { id: OperationsTab; label: string }[] = [
  { id: "inventory", label: "Physical Inventory" },
  { id: "requests", label: "Teacher Requests" },
  { id: "infrastructure", label: "Infrastructure" },
];

function assetStatusBadge(status: AssetStatus) {
  if (status === "available") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (status === "in-use") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
}

function assetStatusLabel(status: AssetStatus) {
  if (status === "available") return "Available";
  if (status === "in-use") return "In Use";
  return "Maintenance";
}

function infraBadgeClass(variant: InfraBadgeVariant) {
  if (variant === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (variant === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
}

function RequestIconBox({ icon }: { icon: TeacherRequest["icon"] }) {
  const Icon =
    icon === "video" ? Video : icon === "laptop" ? Laptop : DoorOpen;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function InfraCard({
  title,
  rows,
}: {
  title: string;
  rows: InfraStatusRow[];
}) {
  return (
    <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-foreground/90">{row.label}</span>
            <Badge
              variant="outline"
              className={cn("text-[11px] font-semibold", infraBadgeClass(row.variant))}
            >
              {row.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OperationsView() {
  const { get, setParams } = useQueryParams();
  const activeTab = parseOpsTab(get(QueryKey.opsTab));
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ??
    "student";
  const roleLoaded = !userLoading;

  const [assets, setAssets] = useState<PhysicalAsset[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [systemHealth, setSystemHealth] = useState<InfraStatusRow[]>([]);
  const [facilityStatus, setFacilityStatus] = useState<InfraStatusRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventory, allRequests, infra] = await Promise.all([
        operationsService.listInventory(),
        operationsService.listRequests(),
        operationsService.getInfrastructure(),
      ]);
      setAssets(inventory);
      setRequests(allRequests);
      setSystemHealth(infra.systemHealth);
      setFacilityStatus(infra.facilityStatus);
    } catch {
      setError("Could not load operations data. Try signing in again as admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roleLoaded && role === "admin") {
      void loadData();
    } else if (roleLoaded) {
      setLoading(false);
    }
  }, [roleLoaded, role, loadData]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  const setActiveTab = useCallback(
    (tab: OperationsTab) => {
      setParams({
        [QueryKey.opsTab]: tab === "inventory" ? null : tab,
      });
    },
    [setParams]
  );

  const handleRequestAction = async (
    id: number,
    action: "approved" | "rejected"
  ) => {
    setActionId(id);
    try {
      const status = action === "approved" ? "APPROVED" : "REJECTED";
      const updated = await operationsService.updateRequestStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch {
      setError("Failed to update request.");
    } finally {
      setActionId(null);
    }
  };

  const handleAddAsset = async (values: AssetFormValues) => {
    setSavingAsset(true);
    try {
      const created = await operationsService.createAsset(values);
      setAssets((prev) => [...prev, created]);
      setAddAssetOpen(false);
    } catch {
      setError("Failed to add asset.");
    } finally {
      setSavingAsset(false);
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
        <Wrench className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          School operations are available to administrators only.
        </p>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/60 dark:border-zinc-800 px-6 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          School Operations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage physical assets, teacher requests, and infrastructure.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex flex-wrap gap-1 border-b border-slate-200/60 dark:border-zinc-800 pb-1">
          {OPS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors inline-flex items-center gap-1.5",
                activeTab === tab.id
                  ? "text-foreground border-b-2 border-violet-500 -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === "requests" && pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="h-5 min-w-5 px-1.5 text-[10px] font-bold border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400"
                >
                  {pendingCount}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {activeTab === "inventory" && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-bold text-foreground">Asset Tracking</h2>
                  <Button size="sm" onClick={() => setAddAssetOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Asset
                  </Button>
                </div>
                <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
                          <th className="px-5 py-3">Asset Name</th>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-[12px]">
                        {assets.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-muted-foreground"
                            >
                              No assets registered yet.
                            </td>
                          </tr>
                        ) : (
                          assets.map((asset) => (
                            <tr
                              key={asset.id}
                              className="hover:bg-slate-100/30 dark:hover:bg-zinc-900/25 transition-colors"
                            >
                              <td className="px-5 py-3.5 font-semibold text-foreground">
                                {asset.name}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {asset.category}
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[11px] font-semibold",
                                    assetStatusBadge(asset.status)
                                  )}
                                >
                                  {assetStatusLabel(asset.status)}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {asset.location}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground">
                                {asset.assignedTo ?? "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "requests" && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Pending Requests
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review and approve resource requests from faculty.
                  </p>
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    No pending requests.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.map((req) => (
                      <Card
                        key={req.id}
                        className="border-slate-200/80 dark:border-zinc-800 shadow-2xs p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <RequestIconBox icon={req.icon} />
                            <div className="min-w-0">
                              <p className="font-bold text-foreground">{req.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Request by:{" "}
                                <span className="font-semibold text-foreground/80">
                                  {req.requester}
                                </span>
                                {" • "}
                                {req.detail}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-500/40 hover:bg-red-500/10"
                              disabled={actionId === req.id}
                              onClick={() =>
                                void handleRequestAction(req.id, "rejected")
                              }
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={actionId === req.id}
                              onClick={() =>
                                void handleRequestAction(req.id, "approved")
                              }
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "infrastructure" && (
              <section className="grid gap-5 sm:grid-cols-2">
                <InfraCard title="System Health" rows={systemHealth} />
                <InfraCard title="Facility Status" rows={facilityStatus} />
              </section>
            )}
          </>
        )}
      </div>

      <AddAssetDialog
        open={addAssetOpen}
        onOpenChange={setAddAssetOpen}
        saving={savingAsset}
        onSave={handleAddAsset}
      />
    </div>
  );
}

