export const SCHOOL_UI = {
  pageTitle: "School Management",
  pageDescription: "",
  tabs: [{ id: "profile", label: "Profile" }],
  profile: {
    profileSectionTitle: "School profile",
    profileSectionDescription:
      "Configure your public student registration portal — share the link, branding, and signup settings.",
    nameLabel: "School name",
    slugLabel: "Portal URL slug",
    taglineLabel: "Tagline",
    taglinePlaceholder: "Short welcome message on your registration page",
    registrationOpenLabel: "Registration open",
    saveProfileLabel: "Save profile",
    coverImageLabel: "Cover image",
    coverImageDescription:
      "Shown as the background when students open your registration link.",
    uploadCoverLabel: "Upload cover",
    removeCoverLabel: "Remove cover",
    registrationUrlLabel: "Student registration link",
    copyUrlLabel: "Copy link",
    copiedUrlMessage: "Link copied!",
    registrationPathPrefix: "/register/",
  },
} as const;
