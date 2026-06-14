"use client";

import { useEffect } from "react";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", mode === "dark" || (mode === "system" && prefersDark));
}

export function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = (localStorage.getItem("lms-theme") as ThemeMode | null) ?? "system";
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("lms-theme") as ThemeMode | null) ?? "system";
      if (current === "system") applyTheme("system");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return children;
}
