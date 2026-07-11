/** Helpers for working with rich-text HTML bodies (announcements, notes). */

/** True when the HTML has no visible text/media — i.e. an "empty" editor body. */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  // Media counts as content — an image-only body is not empty.
  if (/<(img|video|iframe|embed|hr)\b/i.test(html)) return false;
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/** Strip HTML to a plain-text string for previews/excerpts. Browser-only (uses DOM). */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}
