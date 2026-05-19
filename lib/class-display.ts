import type { ClassStatus, ClassSummary } from "@/lib/types/class-api";

const CARD_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-blue-600 to-sky-700",
  "from-emerald-600 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-600 to-fuchsia-700",
];

export function classCardGradient(index: number): string {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

export function formatClassSemester(cls: ClassSummary): string {
  const parts: string[] = [];
  if (cls.semester) parts.push(cls.semester);
  if (cls.academicYear) parts.push(String(cls.academicYear));
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function classStatusLabel(status: ClassStatus): "Active" | "Starts Soon" | "Archived" {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DRAFT":
      return "Starts Soon";
    case "ARCHIVED":
      return "Archived";
    default:
      return "Active";
  }
}

export function parseSemesterFilter(value: string): {
  semester?: string;
  academicYear?: number;
} {
  if (value === "All Semesters") return {};
  const match = value.match(/^(.+),\s*(\d{4})$/);
  if (match) {
    return { semester: match[1].trim(), academicYear: Number(match[2]) };
  }
  return { semester: value };
}
