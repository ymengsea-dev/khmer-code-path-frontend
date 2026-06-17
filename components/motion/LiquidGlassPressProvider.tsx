"use client";

import { useEffect } from "react";
import {
  isLiquidGlassButton,
  triggerGlassPress,
} from "@/lib/motion/is-liquid-glass-button";

/** Global press bounce for liquid-glass buttons (including no-op / decorative taps). */
export function LiquidGlassPressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target as Element | null;
      const control = target?.closest(
        'button, [role="button"], a[href], input[type="button"], input[type="submit"]'
      );

      if (!isLiquidGlassButton(control)) return;
      triggerGlassPress(control);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return children;
}
