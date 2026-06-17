"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import {
  bouncyPressHover,
  bouncyPressTap,
  bouncyTransitions,
} from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

type BouncyPressProps = HTMLMotionProps<"button">;

/** Clickable control with spotlight-style bouncy press feedback. */
export function BouncyPress({ className, children, ...props }: BouncyPressProps) {
  return (
    <motion.button
      type="button"
      whileTap={bouncyPressTap}
      whileHover={{ ...bouncyPressHover, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      transition={bouncyTransitions.press}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type BouncyPressDivProps = HTMLMotionProps<"div">;

/** Non-button clickable surface with the same press morph. */
export function BouncyPressSurface({ className, children, ...props }: BouncyPressDivProps) {
  return (
    <motion.div
      whileTap={bouncyPressTap}
      whileHover={{ ...bouncyPressHover, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      transition={bouncyTransitions.press}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
