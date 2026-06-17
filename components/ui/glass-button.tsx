"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Use the subtler glass token set. */
  subtle?: boolean;
};

/** Liquid-glass button — press bounce is applied globally via `LiquidGlassPressProvider`. */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, subtle, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "liquid-glass-btn inline-flex items-center justify-center outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        subtle && "liquid-glass-btn-subtle",
        className
      )}
      {...props}
    />
  )
);
GlassButton.displayName = "GlassButton";
