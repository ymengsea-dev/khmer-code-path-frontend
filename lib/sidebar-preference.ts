export const SIDEBAR_PINNED_STORAGE_KEY = "lms.sidebar.pinned";

/** Inline script for root layout `<head>` — runs before first paint. */
export const SIDEBAR_PINNED_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(SIDEBAR_PINNED_STORAGE_KEY)};var v=localStorage.getItem(k);document.documentElement.dataset.sidebarPinned=v==="false"?"false":"true";}catch(e){document.documentElement.dataset.sidebarPinned="true";}})();`;

export function readPinnedPreference(fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_PINNED_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    /* ignore storage errors */
  }
  return fallback;
}

export function syncPinnedDataset(pinned: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.sidebarPinned = pinned ? "true" : "false";
}

export function markSidebarHydrated() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.sidebarHydrated = "true";
}

export function writePinnedPreference(pinned: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_PINNED_STORAGE_KEY, String(pinned));
  } catch {
    /* ignore storage errors */
  }
  syncPinnedDataset(pinned);
}
