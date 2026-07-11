import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Backend envelope: { status: { code, message, detail }, data, common }
    const data = error.response?.data as
      | { status?: { message?: string; detail?: string }; message?: string }
      | undefined;
    const message =
      data?.status?.detail ?? data?.status?.message ?? data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
