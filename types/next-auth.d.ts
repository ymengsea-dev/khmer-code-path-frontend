import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: "student" | "teacher" | "admin";
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }

  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError" | "BackendUnavailable";
    user: DefaultSession["user"] & {
      id: string;
      role: "student" | "teacher" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: "student" | "teacher" | "admin";
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError" | "RefreshTokenMissing" | "BackendUnavailable";
  }
}
