"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

const ROLES = [
  {
    title: "System Admin",
    description:
      "Full access to system operations and user management.",
    permissions: [
      { allowed: true, label: "Manage Users" },
      { allowed: true, label: "School Operations" },
      { allowed: true, label: "System Logs" },
      { allowed: false, label: "Academic Grades" },
    ],
  },
  {
    title: "Teacher",
    description: "Access to assigned classes and student performance.",
    permissions: [
      { allowed: true, label: "Manage Classes" },
      { allowed: true, label: "Assign Grades" },
      { allowed: true, label: "Create Quizzes" },
      { allowed: false, label: "Financial Records" },
    ],
  },
  {
    title: "Student",
    description: "Access to enrolled courses and personal learning tools.",
    permissions: [
      { allowed: true, label: "View Classes" },
      { allowed: true, label: "Submit Assignments" },
      { allowed: true, label: "AI Chat & Notebook" },
      { allowed: false, label: "User Management" },
    ],
  },
] as const;

export function UserPermissionsTab() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ROLES.map((role) => (
        <Card
          key={role.title}
          className="border-slate-200/80 dark:border-zinc-800 shadow-2xs"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{role.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </CardHeader>
          <CardContent className={cn("grid gap-2 pt-0")}>
            {role.permissions.map((p) => (
              <PermissionRow
                key={p.label}
                allowed={p.allowed}
                label={p.label}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
