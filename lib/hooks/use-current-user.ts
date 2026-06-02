"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth-service";
import type { UserProfile } from "@/lib/auth/backend-api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await authService.me();
      return (response?.data as UserProfile | undefined) ?? null;
    },
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
