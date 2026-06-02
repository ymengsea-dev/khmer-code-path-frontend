import type { LessonTabDto } from "@/lib/types/class-api";

/** Legacy tab id from older clients / bookmarks. */
const LEGACY_TAB_ALIASES: Record<string, string> = {
  overview: "content",
};

export function resolveLessonTab(
  value: string | null,
  tabs: LessonTabDto[]
): string {
  const fallback = tabs[0]?.id ?? "content";
  const normalized = value ? (LEGACY_TAB_ALIASES[value] ?? value) : null;
  if (normalized && tabs.some((t) => t.id === normalized)) {
    return normalized;
  }
  return fallback;
}

export function lessonTabLabel(
  tab: LessonTabDto,
  count?: number
): string {
  if (tab.id === "materials" && count != null) {
    return `${tab.label} (${count})`;
  }
  if (tab.id === "content" && count != null) {
    return `${tab.label} (${count})`;
  }
  return tab.label;
}
