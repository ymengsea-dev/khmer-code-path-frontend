"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import {
  bouncyListItemVariants,
  bouncyStaggerContainerVariants,
  bouncyStaggerItemVariants,
} from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

type BouncyStaggerProps = HTMLMotionProps<"div">;

export function BouncyStagger({ className, children, ...props }: BouncyStaggerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={bouncyStaggerContainerVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type BouncyStaggerItemProps = HTMLMotionProps<"div"> & {
  /** `simple` = fade + slide only; `bounce` = overshoot scale (default). */
  enter?: "simple" | "bounce";
};

export function BouncyStaggerItem({
  className,
  children,
  enter = "bounce",
  ...props
}: BouncyStaggerItemProps) {
  const variants = enter === "simple" ? bouncyListItemVariants : bouncyStaggerItemVariants;

  return (
    <motion.div variants={variants} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}
