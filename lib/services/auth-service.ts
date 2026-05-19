import { signIn, signOut } from "next-auth/react";
import { apiClient } from "../api-client";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const result = await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("Invalid email or password. Please try again.");
    }

    return result;
  },

  async loginWithOAuthTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: string;
  }) {
    const result = await signIn("oauth-callback", {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn ?? "3600",
      redirect: false,
    });

    if (result?.error) {
      throw new Error("OAuth sign-in failed. Please try again.");
    }

    return result;
  },

  googleLogin() {
    window.location.href = `${BACKEND_ORIGIN}/api/v1/auth/google`;
  },

  async logout() {
    await signOut({ callbackUrl: "/login" });
  },

  async me() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};
