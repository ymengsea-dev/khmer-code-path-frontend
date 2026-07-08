/** Read at call time — Cloudflare Workers populate process.env after module load. */
export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";
}

export const REFRESH_COOKIE_NAME = "ailms_refresh_token";
