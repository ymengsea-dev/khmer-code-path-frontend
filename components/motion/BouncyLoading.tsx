"use client";

import { motion } from "framer-motion";
import { bouncyLoadingVariants } from "@/lib/motion/bouncy-motion";
import { cn } from "@/lib/utils";

type BouncyLoadingProps = {
  className?: string;
  lines?: number;
};

/** Morphing skeleton block for card / panel loading states. */
export function BouncyLoading({ className, lines = 3 }: BouncyLoadingProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          initial="initial"
          animate="animate"
          variants={bouncyLoadingVariants}
          transition={{ delay: index * 0.12 }}
          style={{ transformOrigin: "left center" }}
          className="h-3 rounded-full bg-muted-foreground/15"
        />
      ))}
    </div>
  );
}

type BouncyLoadingCardProps = {
  className?: string;
  children?: React.ReactNode;
};

/** Glass-style loading card with bouncy morph pulse. */
export function BouncyLoadingCard({ className, children }: BouncyLoadingCardProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={bouncyLoadingVariants}
      style={{ transformOrigin: "center center" }}
      className={cn(
        "rounded-2xl p-5 border border-[var(--glass-border-color)] bg-[var(--glass-bg-subtle)]",
        className
      )}
    >
      {children ?? <BouncyLoading lines={4} />}
    </motion.div>
  );
}
