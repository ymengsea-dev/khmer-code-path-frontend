/** Tag stored in API as `label|#hex` (comma-separated list on the note). */

export interface NoteTag {
  label: string;
  color: string;
}

export const NOTE_TAG_COLORS = [
  { hex: "#8e8e93", label: "Gray" },
  { hex: "#ff3b30", label: "Red" },
  { hex: "#ff9500", label: "Orange" },
  { hex: "#ffcc00", label: "Yellow" },
  { hex: "#34c759", label: "Green" },
  { hex: "#007aff", label: "Blue" },
  { hex: "#5856d6", label: "Purple" },
  { hex: "#af52de", label: "Pink" },
] as const;

export const DEFAULT_TAG_COLOR = NOTE_TAG_COLORS[0].hex;

const TAG_SPLIT = "|";

export function parseNoteTag(raw: string): NoteTag | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const pipe = trimmed.lastIndexOf(TAG_SPLIT);
  if (pipe > 0) {
    const label = trimmed.slice(0, pipe).trim();
    const color = trimmed.slice(pipe + 1).trim();
    if (label && /^#[0-9a-fA-F]{6}$/.test(color)) {
      return { label, color };
    }
  }
  return { label: trimmed, color: DEFAULT_TAG_COLOR };
}

export function parseNoteTags(raw: string[] | undefined | null): NoteTag[] {
  if (!raw?.length) return [];
  return raw.map(parseNoteTag).filter((t): t is NoteTag => t !== null && t.label.length > 0);
}

export function serializeNoteTag(tag: NoteTag): string {
  const label = tag.label.trim();
  const color = tag.color || DEFAULT_TAG_COLOR;
  return `${label}${TAG_SPLIT}${color}`;
}

export function serializeNoteTags(tags: NoteTag[]): string[] {
  return tags
    .filter((t) => t.label.trim())
    .slice(0, 5)
    .map(serializeNoteTag);
}

export function primaryTagColor(tags: string[] | undefined | null): string | null {
  const parsed = parseNoteTags(tags);
  return parsed[0]?.color ?? null;
}

export function primaryTagLabel(tags: string[] | undefined | null): string | null {
  const parsed = parseNoteTags(tags);
  return parsed[0]?.label ?? null;
}
