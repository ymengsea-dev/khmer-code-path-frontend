import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import {
  backendLogin,
  backendLogout,
  backendMe,
  type LmsRole,
} from "@/lib/auth/backend-api";
import { refreshAccessToken } from "@/lib/auth/refresh-access-token";

function mapRole(role: LmsRole) {
  return role.toLowerCase() as "student" | "teacher" | "admin";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const data = await backendLogin(email, password);
          const expiresInMs = (data.expiresIn ?? 3600) * 1000;

          return {
            id: data.user.userId,
            email: data.user.email,
            name: data.user.userName,
            role: mapRole(data.user.role),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpires: Date.now() + expiresInMs,
          };
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: "oauth-callback",
      name: "OAuth Callback",
      credentials: {
        accessToken: { type: "text" },
        refreshToken: { type: "text" },
        expiresIn: { type: "text" },
      },
      async authorize(credentials) {
        const accessToken = credentials?.accessToken as string | undefined;
        const refreshToken = (credentials?.refreshToken as string | undefined)?.trim();
        if (!accessToken) return null;

        try {
          const user = await backendMe(accessToken);
          const expiresInSec = Number(credentials?.expiresIn ?? 3600);
          const expiresInMs = expiresInSec * 1000;

          return {
            id: user.userId,
            email: user.email,
            name: user.userName,
            role: mapRole(user.role),
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
            accessTokenExpires: Date.now() + expiresInMs,
          };
        } catch (err) {
          console.error("[oauth-callback] authorize failed:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user && account) {
        return {
          ...token,
          sub: user.id ?? token.sub,
          email: user.email,
          name: user.name,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          error: undefined,
        };
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (
        token.error === "RefreshAccessTokenError" ||
        token.error === "BackendUnavailable"
      ) {
        session.error = token.error;
      }

      session.accessToken = token.accessToken as string | undefined;
      session.accessTokenExpires = token.accessTokenExpires as
        | number
        | undefined;
      session.user.id = token.sub ?? "";
      session.user.role = (token.role as "student" | "teacher" | "admin") ?? "student";
      if (token.name) {
        session.user.name = token.name as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      const token =
        "token" in message ? message.token : null;
      await backendLogout(token?.refreshToken as string | undefined);
    },
  },
});
