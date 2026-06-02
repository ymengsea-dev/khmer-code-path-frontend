import axios from "axios";

/** User-facing message from LMS API error body (`status.detail` or `status.message`). */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.data?.status as
      | { detail?: string; message?: string }
      | undefined;
    if (status?.detail?.trim()) return status.detail.trim();
    if (status?.message?.trim()) return status.message.trim();
  }
  return fallback;
}
