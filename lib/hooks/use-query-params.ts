"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type QueryUpdates = Record<string, string | null | undefined>;

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string): string | null => searchParams.get(key),
    [searchParams]
  );

  const getAll = useCallback((): URLSearchParams => {
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  const setParams = useCallback(
    (updates: QueryUpdates, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const qs = params.toString();
      const current = searchParams.toString();
      if (qs === current) {
        return;
      }

      const href = qs ? `${pathname}?${qs}` : pathname;
      const navigate = options?.replace === false ? router.push : router.replace;
      navigate(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return useMemo(
    () => ({ get, getAll, setParams, searchParams }),
    [get, getAll, setParams, searchParams]
  );
}

/**
 * Bind a single query param to a string value (URL is source of truth on refresh).
 */
export function useQueryState(
  key: string,
  defaultValue = ""
): [string, (value: string) => void] {
  const { get, setParams } = useQueryParams();

  const value = get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setParams({
        [key]: next === defaultValue ? null : next,
      });
    },
    [key, defaultValue, setParams]
  );

  return [value, setValue];
}
