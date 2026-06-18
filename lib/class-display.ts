import type { SemesterFilterDto } from "@/lib/types/class-api";

export function parseSemesterFilter(
  selectedValue: string,
  filters: SemesterFilterDto[]
): { semester?: string; academicYear?: number } {
  const match = filters.find((f) => f.value === selectedValue);
  if (!match?.semester) {
    return {};
  }
  return {
    semester: match.semester,
    academicYear: match.academicYear ?? undefined,
  };
}

export function resolveSemesterSelection(
  paramValue: string | null,
  allSemestersLabel: string
): string {
  if (!paramValue) {
    return allSemestersLabel;
  }
  try {
    return decodeURIComponent(paramValue);
  } catch {
    return paramValue;
  }
}

export function semesterToParam(label: string, allSemestersLabel: string): string | null {
  if (label === allSemestersLabel) return null;
  return encodeURIComponent(label);
}

/** Tailwind `from-*` token → solid color for sidebar class dots (avoids dynamic class purge). */
const GRADIENT_FROM_COLORS: Record<string, string> = {
  "indigo-500": "#6366f1",
  "blue-600": "#2563eb",
  "sky-700": "#0369a1",
  "emerald-600": "#059669",
  "teal-700": "#0f766e",
  "amber-500": "#f59e0b",
  "orange-600": "#ea580c",
  "rose-500": "#f43f5e",
  "pink-600": "#db2777",
  "violet-600": "#7c3aed",
  "violet-800": "#5b21b6",
  "fuchsia-700": "#a21caf",
  "purple-600": "#9333ea",
};

const DEFAULT_GRADIENT_DOT = "#7c3aed";

/** Solid dot color derived from API `cardGradient` (e.g. "from-indigo-500 to-purple-600"). */
export function classGradientDotColor(cardGradient: string | null | undefined): string {
  const fromToken =
    cardGradient?.split(/\s+/).find((part) => part.startsWith("from-")) ?? "";
  const key = fromToken.replace(/^from-/, "");
  return GRADIENT_FROM_COLORS[key] ?? DEFAULT_GRADIENT_DOT;
}
