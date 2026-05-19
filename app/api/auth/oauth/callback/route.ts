import { signIn } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Server-side OAuth handoff from the Java backend.
 * Completes the session without putting long JWTs through client-side signIn.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const refresh = searchParams.get("refresh");
  const expiresIn = searchParams.get("expiresIn") ?? "3600";
  const oauthError = searchParams.get("error");

  if (oauthError) {
    redirect(`/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (!token) {
    redirect("/login?error=oauth_missing_token");
  }

  try {
    const result = await signIn("oauth-callback", {
      accessToken: token,
      refreshToken: refresh ?? "",
      expiresIn,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      redirect("/login?error=oauth_session_failed");
    }
  } catch {
    redirect("/login?error=oauth_session_failed");
  }

  redirect("/");
}
