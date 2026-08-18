"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Small panel / feedback entrance: opacity + scale(0.97 -> 1), per the motion spec. */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
