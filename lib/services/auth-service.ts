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

  async updateProfile(payload: { userName: string; bio?: string }) {
    const response = await apiClient.patch("/auth/me", payload);
    return response.data;
  },

  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post("/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await apiClient.post("/auth/me/password", payload);
  },

  async requestPasswordReset(email: string) {
    await apiClient.post("/auth/password-reset/request", { email });
  },

  async confirmPasswordReset(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await apiClient.post("/auth/password-reset/confirm", payload);
  },
};
