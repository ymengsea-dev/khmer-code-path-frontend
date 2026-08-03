const DEFAULT_NOTE_ID_KEY = "lms-default-note-id";

/** Where quick "Add to note" actions (AI Chat, lesson selection, ...) append to by default. */
export function getDefaultNoteId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEFAULT_NOTE_ID_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

export function setDefaultNoteId(id: number | null): void {
  if (id == null) {
    localStorage.removeItem(DEFAULT_NOTE_ID_KEY);
  } else {
    localStorage.setItem(DEFAULT_NOTE_ID_KEY, String(id));
  }
}
