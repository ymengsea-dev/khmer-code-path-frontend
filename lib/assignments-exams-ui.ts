/** Frontend-only UI for Assignments & Exams (nav/tabs/labels by role, not backend config). */

export const ASSIGNMENTS_EXAMS_NAV_LABEL = "Assignments & Exams";

export const ASSIGNMENTS_EXAMS_TABS = [
  { id: "assignments", label: "Assignments" },
  { id: "exams", label: "Exams" },
] as const;

export interface ContentBuilderLabels {
  sectionTitle: string;
  aiSectionLabel: string;
  aiGenerateLabel: string;
  fileSectionLabel: string;
  fileUploadLabel: string;
  librarySectionLabel: string;
  librarySelectLabel: string;
  emptyContentHint: string;
}

export const ASSIGNMENTS_EXAMS_CONTENT_BUILDER: ContentBuilderLabels = {
  sectionTitle: "Content",
  aiSectionLabel: "AI questions",
  aiGenerateLabel: "Generate questions",
  fileSectionLabel: "Upload files",
  fileUploadLabel: "Add file",
  librarySectionLabel: "Content Management",
  librarySelectLabel: "Add from library",
  emptyContentHint:
    "Add AI questions, upload problem files, and/or attach Content Management materials. You can combine all three.",
};

/** Teachers and students see Assignments & Exams; school admins do not. */
export function canAccessAssignmentsExams(
  role: "student" | "teacher" | "admin" | string | null | undefined,
): boolean {
  const r = (role ?? "student").toLowerCase();
  return r === "student" || r === "teacher";
}
