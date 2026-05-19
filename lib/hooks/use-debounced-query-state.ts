"use client";

import { useEffect, useState } from "react";
import { useQueryParams } from "./use-query-params";

export function useDebouncedQueryState(
  key: string,
  defaultValue = "",
  debounceMs = 350
): [string, (value: string) => void] {
  const { get, setParams } = useQueryParams();
  const urlValue = get(key) ?? defaultValue;
  const [localValue, setLocalValue] = useState(urlValue);

  useEffect(() => {
    setLocalValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const empty = localValue === defaultValue || localValue === "";
      const desired = empty ? null : localValue;
      const current = get(key);
      if ((desired ?? "") === (current ?? "")) {
        return;
      }
      setParams({ [key]: desired });
    }, debounceMs);
    return () => window.clearTimeout(id);
  }, [localValue, key, defaultValue, debounceMs, setParams, get]);

  return [localValue, setLocalValue];
}
