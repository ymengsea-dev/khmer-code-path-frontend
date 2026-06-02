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
