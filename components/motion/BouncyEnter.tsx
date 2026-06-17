"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import {
  bouncyEnterVariants,
  bouncyOpenVariants,
} from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

type BouncyEnterProps = HTMLMotionProps<"div"> & {
  /** `open` = larger overshoot (dialogs); `enter` = default card mount. */
  variant?: "enter" | "open";
};

/** Mount animation for cards, panels, and sections. */
export function BouncyEnter({
  className,
  children,
  variant = "enter",
  ...props
}: BouncyEnterProps) {
  const variants = variant === "open" ? bouncyOpenVariants : bouncyEnterVariants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
