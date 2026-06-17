"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { bouncyMorphVariants } from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

type BouncyMorphProps = HTMLMotionProps<"div">;

/** Horizontal squash-and-stretch morph (search compact ↔ wide). */
export function BouncyMorph({ className, children, ...props }: BouncyMorphProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={bouncyMorphVariants}
      style={{ transformOrigin: "center center" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
