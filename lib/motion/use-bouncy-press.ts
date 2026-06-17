"use client";

import { useCallback, useState } from "react";
import { bouncyClassNames } from "@/lib/motion/bouncy-motion";

const PRESS_MS = 380;

/**
 * Adds a one-shot CSS press morph on trigger — useful for native `<button>` elements
 * that cannot use Framer Motion directly.
 */
export function useBouncyPress() {
  const [active, setActive] = useState(false);

  const trigger = useCallback(() => {
    setActive(true);
    window.setTimeout(() => setActive(false), PRESS_MS);
  }, []);

  const onPointerDown = useCallback(() => {
    setActive(true);
  }, []);

  const onPointerUp = useCallback(() => {
    window.setTimeout(() => setActive(false), PRESS_MS);
  }, []);

  return {
    active,
    trigger,
    pressProps: {
      onPointerDown,
      onPointerUp,
      onPointerLeave: onPointerUp,
    },
    className: active ? bouncyClassNames.pressActive : undefined,
  };
}
