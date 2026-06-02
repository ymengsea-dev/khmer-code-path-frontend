export const EMPTY_EDITOR_HTML = "<p><br></p>";

/** Normalize stored plain text or HTML into editor-ready HTML. */
export function toEditorHtml(content: string | null | undefined): string {
  const raw = content?.trim();
  if (!raw) return EMPTY_EDITOR_HTML;
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}

/** Strip empty editor placeholder to null for API persistence. */
export function fromEditorHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed || trimmed === EMPTY_EDITOR_HTML || trimmed === "<p></p>") {
    return null;
  }
  return html;
}

/** Plain-text preview for list cards (strips HTML). */
export function toPlainTextPreview(content: string | null | undefined, maxLen = 160): string {
  if (!content?.trim()) return "";
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function formatDocumentTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
