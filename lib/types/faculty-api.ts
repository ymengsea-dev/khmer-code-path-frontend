export type FacultyStatusDto = "ACTIVE" | "INACTIVE";

export interface FacultySummaryDto {
  id: number;
  name: string;
  tagline?: string | null;
  coverUrl?: string | null;
  status: FacultyStatusDto;
  departmentCount: number;
}

export interface FacultyConfigDto {
  pageTitle: string;
  pageDescription: string;
  sectionTitle: string;
  sectionDescription: string;
  nameLabel: string;
  taglineLabel: string;
  taglinePlaceholder: string;
  addButtonLabel: string;
  saveButtonLabel: string;
  configureButtonLabel: string;
  emptyMessage: string;
  noResultsMessage: string;
  searchPlaceholder: string;
  departmentCountLabel: string;
  coverImageLabel: string;
  coverImageDescription: string;
  uploadCoverLabel: string;
  removeCoverLabel: string;
  configureDialogTitle: string;
  configureDialogDescription: string;
  backToFacultiesLabel: string;
  cardGradients: string[];
}

export interface CreateFacultyPayload {
  name: string;
  status?: FacultyStatusDto;
}

export interface UpdateFacultyPayload {
  name?: string;
  tagline?: string | null;
  status?: FacultyStatusDto;
}
