export function getUserInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function getRoleLabel(role: string | undefined): string {
  switch (role?.toLowerCase()) {
    case "teacher":
      return "Teacher";
    case "admin":
      return "Administrator";
    case "student":
    default:
      return "Learner";
  }
}
