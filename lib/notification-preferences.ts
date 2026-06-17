const NOTIFICATIONS_ENABLED_KEY = "lms-notifications-enabled";
export const NOTIFICATIONS_PREFERENCE_EVENT = "lms-notifications-preference-changed";

export function getNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== "false";
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(NOTIFICATIONS_PREFERENCE_EVENT));
}
