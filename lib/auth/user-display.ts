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

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  cacheBust?: string | number
): string | null {
  if (!avatarUrl) return null;
  const base = avatarUrl.startsWith("http")
    ? avatarUrl
    : `${BACKEND_ORIGIN}${avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`}`;
  if (cacheBust == null) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${encodeURIComponent(String(cacheBust))}`;
}
