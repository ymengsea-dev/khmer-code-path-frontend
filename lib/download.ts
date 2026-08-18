import { getValidAccessToken } from "@/lib/auth/client-session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

/**
 * Appends the anchor to the DOM before click(); required for the download to fire
 * in Firefox/Safari and some blob-URL cases in Chromium. Throws on a non-OK
 * response so callers can surface the failure.
 */
export async function downloadAuthedFile(url: string, fileName: string) {
  const token = await getValidAccessToken();
  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE}${url.startsWith("/api/v1") ? url.slice("/api/v1".length) : url}`;
  const res = await fetch(fullUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}
