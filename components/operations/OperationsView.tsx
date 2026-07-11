"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Wrench,
  Loader2,
  Plus,
  Video,
  Laptop,
  DoorOpen,
  Pencil,
  Trash2,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  AssetStatus,
} from "@/data/operations";
import { AddAssetDialog, type AssetFormValues } from "./AddAssetDialog";
import { RequestDialog, type RequestFormValues } from "./RequestDialog";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const OPS_TABS: { id: OperationsTab; label: string }[] = [
  { id: "inventory", label: "Physical Inventory" },
  { id: "requests", label: "Teacher Requests" },
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

function requestStatusMeta(status: TeacherRequest["status"]) {
  if (status === "approved") {
    return {
      icon: CheckCircle2,
      label: "Approved",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  }
  if (status === "rejected") {
    return {
      icon: XCircle,
      label: "Rejected",
      className:
        "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    };
  }
  return {
    icon: Clock,
    label: "Pending",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
}

function RequestIconBox({ icon }: { icon: TeacherRequest["icon"] }) {
  const Icon = icon === "video" ? Video : icon === "laptop" ? Laptop : DoorOpen;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function toAssetForm(asset: PhysicalAsset): AssetFormValues {
  return {
    name: asset.name,
    category: asset.category,
    status: asset.status,
    location: asset.location,
    assignedTo: asset.assignedTo ?? "",
  };
}

export function OperationsView() {
  const { confirm } = useConfirm();
  const { get, setParams } = useQueryParams();
  const activeTab: OperationsTab =
    parseOpsTab(get(QueryKey.opsTab)) === "requests" ? "requests" : "inventory";
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const role =
    (currentUser?.role?.toLowerCase() as "student" | "teacher" | "admin") ??
    "student";
  const roleLoaded = !userLoading;
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  const [assets, setAssets] = useState<PhysicalAsset[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [myRequests, setMyRequests] = useState<TeacherRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PhysicalAsset | null>(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [reqFilter, setReqFilter] = useState<"pending" | "all">("pending");

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventory, allRequests] = await Promise.all([
        operationsService.listInventory(),
        operationsService.listRequests(),
      ]);
      setAssets(inventory);
      setRequests(allRequests);
    } catch {
      setError("Could not load operations data. Try signing in again as admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMyRequests(await operationsService.listMyRequests());
    } catch {
      setError("Could not load your requests. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roleLoaded) return;
    if (isAdmin) void loadAdmin();
    else if (isTeacher) void loadTeacher();
    else setLoading(false);
  }, [roleLoaded, isAdmin, isTeacher, loadAdmin, loadTeacher]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests],
  );

  const setActiveTab = useCallback(
    (tab: OperationsTab) => {
      setParams({ [QueryKey.opsTab]: tab === "inventory" ? null : tab });
    },
    [setParams],
  );

  const handleRequestAction = async (
    id: number,
    action: "approved" | "rejected",
  ) => {
    setActionId(id);
    try {
      const status = action === "approved" ? "APPROVED" : "REJECTED";
      const updated = await operationsService.updateRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError("Failed to update request.");
    } finally {
      setActionId(null);
    }
  };

  const handleSaveAsset = async (values: AssetFormValues) => {
    setSavingAsset(true);
    try {
      if (editingAsset) {
        const updated = await operationsService.updateAsset(
          editingAsset.id,
          values,
        );
        setAssets((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a)),
        );
      } else {
        const created = await operationsService.createAsset(values);
        setAssets((prev) => [...prev, created]);
      }
      setAssetDialogOpen(false);
      setEditingAsset(null);
    } catch {
      setError(editingAsset ? "Failed to update asset." : "Failed to add asset.");
    } finally {
      setSavingAsset(false);
    }
  };

  const handleCreateRequest = async (values: RequestFormValues) => {
    setSavingRequest(true);
    try {
      const created = await operationsService.createRequest(values);
      setMyRequests((prev) => [created, ...prev]);
      setRequestDialogOpen(false);
    } catch {
      setError("Failed to submit request.");
    } finally {
      setSavingRequest(false);
    }
  };

  const openAddAsset = () => {
    setEditingAsset(null);
    setAssetDialogOpen(true);
  };
  const openEditAsset = (asset: PhysicalAsset) => {
    setEditingAsset(asset);
    setAssetDialogOpen(true);
  };

  const handleDeleteAsset = async (asset: PhysicalAsset) => {
    const ok = await confirm(
      `Delete "${asset.name}"? This removes it from asset tracking.`,
      { title: "Delete asset", variant: "destructive", confirmLabel: "Delete" },
    );
    if (!ok) return;
    try {
      await operationsService.deleteAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch {
      setError("Failed to delete asset.");
    }
  };

  if (!roleLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---- Teacher view: submit + track own requests ----
  if (isTeacher) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">My Requests</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Request equipment, a room, or a device from the school office.
              </p>
            </div>
            <Button size="sm" onClick={() => setRequestDialogOpen(true)}>
              <Send className="h-4 w-4 mr-1.5" />
              New Request
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myRequests.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-14 text-center border-slate-200/80 dark:border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <Inbox className="h-6 w-6 text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No requests yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Submit a request and track its approval status here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {myRequests.map((req) => (
                <RequestCard key={req.id} req={req} showStatus />
              ))}
            </div>
          )}
        </div>

        <RequestDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          saving={savingRequest}
          onSave={handleCreateRequest}
        />
      </div>
    );
  }

  // ---- Non-admin, non-teacher: blocked ----
  if (!isAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <Wrench className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          School operations are available to staff only.
        </p>
      </div>
    );
  }

  // ---- Admin view ----
  const visibleRequests =
    reqFilter === "pending"
      ? requests.filter((r) => r.status === "pending")
      : requests;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-4">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/40 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {OPS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-2xl transition-colors inline-flex items-center gap-1.5",
                  activeTab === tab.id
                    ? "bg-white/42 text-foreground ring-1 ring-zinc-200/60 dark:bg-white/8 dark:ring-white/10"
                    : "text-muted-foreground hover:bg-white/22 dark:hover:bg-white/6 hover:text-foreground",
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
          {activeTab === "inventory" && (
            <Button size="sm" className="ml-auto" onClick={openAddAsset}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Asset
            </Button>
          )}
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
                <h2 className="text-lg font-bold text-foreground">
                  Asset Tracking
                </h2>
                <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-180 text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-200/60 dark:border-zinc-800">
                          <th className="px-5 py-3">Asset Name</th>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Assigned To</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-[12px]">
                        {assets.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-8 text-center text-muted-foreground"
                            >
                              No assets registered yet.
                            </td>
                          </tr>
                        ) : (
                          assets.map((asset) => (
                            <tr
                              key={asset.id}
                              className="group hover:bg-slate-100/30 dark:hover:bg-zinc-900/25 transition-colors"
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
                                    assetStatusBadge(asset.status),
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
                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-2">
                                  <GlassButton
                                    subtle
                                    onClick={() => openEditAsset(asset)}
                                    className="h-8 gap-1 rounded-full px-3 text-[12px] font-semibold text-muted-foreground"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                  </GlassButton>
                                  <GlassButton
                                    subtle
                                    onClick={() => void handleDeleteAsset(asset)}
                                    aria-label={`Delete ${asset.name}`}
                                    className="h-8 gap-1 rounded-full px-3 text-[12px] font-semibold text-red-600 hover:text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </GlassButton>
                                </div>
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
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Teacher Requests
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review and approve resource requests from faculty.
                    </p>
                  </div>
                  <div className="flex gap-1.5 rounded-2xl bg-black/3 p-1 dark:bg-white/4">
                    {(["pending", "all"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setReqFilter(f)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors",
                          reqFilter === f
                            ? "bg-white text-foreground shadow-2xs dark:bg-white/12"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleRequests.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center gap-3 py-14 text-center border-slate-200/80 dark:border-zinc-800">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                      <Inbox className="h-6 w-6 text-violet-500" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {reqFilter === "pending"
                        ? "No pending requests"
                        : "No requests"}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {visibleRequests.map((req) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        showStatus={req.status !== "pending"}
                        actions={
                          req.status === "pending" ? (
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
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <AddAssetDialog
        open={assetDialogOpen}
        onOpenChange={(o) => {
          setAssetDialogOpen(o);
          if (!o) setEditingAsset(null);
        }}
        saving={savingAsset}
        onSave={handleSaveAsset}
        initialValues={editingAsset ? toAssetForm(editingAsset) : null}
      />
    </div>
  );
}

function RequestCard({
  req,
  showStatus,
  actions,
}: {
  req: TeacherRequest;
  showStatus?: boolean;
  actions?: ReactNode;
}) {
  const status = requestStatusMeta(req.status);
  const StatusIcon = status.icon;
  return (
    <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <RequestIconBox icon={req.icon} />
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{req.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Request by:{" "}
              <span className="font-semibold text-foreground/80">
                {req.requester}
              </span>
              {req.detail ? (
                <>
                  {" • "}
                  {req.detail}
                </>
              ) : null}
            </p>
          </div>
        </div>
        {actions ??
          (showStatus ? (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 gap-1.5 text-[11px] font-semibold",
                status.className,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          ) : null)}
      </div>
    </Card>
  );
}
