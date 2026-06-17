"use client";

import { useSession } from "next-auth/react";
import { getRoleLabel } from "@/lib/auth/user-display";
import type { LmsRole, UserProfile } from "@/lib/auth/backend-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export type AppRole = "student" | "teacher" | "admin";

export function useUserProfile() {
  const { data: session, status: sessionStatus } = useSession();
  const query = useCurrentUser();
  const user = query.data;

  const displayName =
    user?.userName?.trim() || session?.user?.name?.trim() || "";
  const email = user?.email || session?.user?.email || "";
  const avatarUrl = user?.avatarUrl ?? null;
  const roleRaw = user?.role ?? session?.user?.role;
  const role = (roleRaw?.toLowerCase() ?? "student") as AppRole;

  return {
    ...query,
    user: user as UserProfile | null,
    displayName,
    email,
    avatarUrl,
    bio: user?.bio ?? null,
    role,
    lmsRole: roleRaw as LmsRole | undefined,
    roleLabel: getRoleLabel(roleRaw),
    userId: user?.userId ?? null,
    avatarName: displayName || email || "?",
    isLoading: query.isLoading || sessionStatus === "loading",
  };
}
