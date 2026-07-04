export const MATERIAL_LIBRARY_UI = {
  uploadAccept: ".pdf,.pptx,.docx",
  views: [
    {
      id: "all",
      label: "All",
      searchPlaceholder: "Search templates and files…",
    },
    {
      id: "templates",
      label: "Templates",
      searchPlaceholder: "Search templates…",
    },
    {
      id: "files",
      label: "File attachments",
      searchPlaceholder: "Search file attachments…",
    },
  ],
  createDefaults: {
    title: "New Lesson Template",
    iconType: "SLIDES",
    gradient: "from-violet-800 to-violet-600",
  },
  filePoolLabel: "Stored files",
} as const;
