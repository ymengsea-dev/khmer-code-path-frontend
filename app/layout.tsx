import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SIDEBAR_PINNED_BOOTSTRAP_SCRIPT } from "@/lib/sidebar-preference";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AppQueryProvider } from "@/components/providers/query-provider";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
import { NotificationProvider } from "@/components/notifications/notification-context";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { LiquidGlassPressProvider } from "@/components/motion/LiquidGlassPressProvider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Editorial serif for the announcements "read as article" feed — see AnnouncementsView. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AI-LMS",
  description: "School learning management system",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: SIDEBAR_PINNED_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <AppQueryProvider>
          <AuthSessionProvider>
            <ThemeBootstrap>
              <NotificationProvider>
                <LiquidGlassPressProvider>
                  <ConfirmProvider>{children}</ConfirmProvider>
                </LiquidGlassPressProvider>
              </NotificationProvider>
            </ThemeBootstrap>
          </AuthSessionProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
