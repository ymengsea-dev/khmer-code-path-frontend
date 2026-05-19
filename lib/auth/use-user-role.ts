"use client";

import { useSession } from "next-auth/react";
import type { LmsRole } from "./backend-api";

export type UserRole = "student" | "teacher" | "admin";

export function useUserRole(): UserRole {
  const { data: session } = useSession();
  return session?.user?.role ?? "student";
}

/** Map session role to API-style enum when needed. */
export function toApiRole(role: UserRole): LmsRole {
  return role.toUpperCase() as LmsRole;
}
