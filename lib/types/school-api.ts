export type SchoolDetail = {
  id: number;
  name: string;
  slug: string;
  status: string;
  registrationOpen: boolean;
  tagline?: string | null;
  coverUrl?: string | null;
  registrationPath?: string;
  registrationUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SchoolRegistrationInfo = {
  schoolId: number;
  name: string;
  slug: string;
  registrationOpen: boolean;
  tagline?: string | null;
  coverUrl?: string | null;
  domainRequired: boolean;
  allowedDomains: string[];
};

export type SchoolConfigTab = {
  id: string;
  label: string;
};

export type SchoolProfileConfig = {
  profileSectionTitle: string;
  profileSectionDescription?: string;
  nameLabel: string;
  slugLabel: string;
  taglineLabel: string;
  taglinePlaceholder: string;
  registrationOpenLabel: string;
  saveProfileLabel: string;
  coverImageLabel: string;
  coverImageDescription: string;
  uploadCoverLabel: string;
  removeCoverLabel: string;
  registrationUrlLabel: string;
  copyUrlLabel: string;
  copiedUrlMessage: string;
  registrationPathPrefix: string;
};

export type SchoolConfig = {
  pageTitle: string;
  pageDescription: string;
  tabs: SchoolConfigTab[];
  profile?: SchoolProfileConfig;
};

export type RegistrationDomain = {
  id: number;
  domain: string;
  autoApprove: boolean;
  defaultRole: string;
  createdAt?: string;
};

export type RegistrationDomainConfig = {
  pageTitle: string;
  pageDescription: string;
  domainInputLabel: string;
  domainInputPlaceholder: string;
  addButtonLabel: string;
  emptyMessage: string;
};

export type UpdateSchoolPayload = {
  name?: string;
  slug?: string;
  registrationOpen?: boolean;
  tagline?: string | null;
};

export type CreateRegistrationDomainPayload = {
  domain: string;
};
