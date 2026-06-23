import { signIn, signOut } from "next-auth/react";
import axios from "axios";
import { apiClient } from "../api-client";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const result = await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    if (!result?.ok || result.error) {
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

  googleLogin(schoolSlug?: string) {
    const url = new URL(`${BACKEND_ORIGIN}/api/v1/auth/google`);
    if (schoolSlug?.trim()) {
      url.searchParams.set("schoolSlug", schoolSlug.trim());
    }
    window.location.href = url.toString();
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

  async register(payload: {
    username: string;
    email: string;
    password: string;
    schoolSlug: string;
  }) {
    await axios.post(`${API_BASE_URL}/auth/register`, payload, {
      headers: { "Content-Type": "application/json" },
    });
  },
};
