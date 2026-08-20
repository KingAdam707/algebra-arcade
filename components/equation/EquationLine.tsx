"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Equation } from "@/domain/equation";
import { formatEquation, spokenEquation, type FormattedTerm } from "@/domain/formatter";
import { TermToken } from "./TermToken";

export type HighlightedTerms = { side: "left" | "right"; indices: number[] } | null;

const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/**
 * The stable three-column equation grid: [ LHS, right-aligned ] [ = ] [ RHS, left-aligned ].
 * The equals sign never moves, reinforcing balance during every transformation. Terms use
 * Motion's layout animation so remaining terms glide into their new position when a sibling
 * term appears or is removed. Removed terms disappear immediately rather than fading out:
 * wrapping this in AnimatePresence (for an exit fade) reproducibly leaves the exiting term
 * stuck on screen at full opacity with the current motion/React version combo, so the exit
 * animation is intentionally dropped in favour of a correct equation display.
 */
export function EquationLine({
  equation,
  highlight = null,
  size = "lg",
  announce = false,
}: {
  equation: Equation;
  highlight?: HighlightedTerms;
  size?: "sm" | "lg";
  announce?: boolean;
}) {
  const tree = formatEquation(equation);
  // Kept deliberately modest: at the old clamp(2rem,5vw,4rem) a step with 3-4 terms on one
  // side would frequently overflow the available column width and wrap onto a second line,
  // making the equation stage balloon vertically instead of just filling the row.
  const textSize = size === "lg" ? "text-[clamp(1.375rem,3.5vw,2.5rem)]" : "text-[clamp(1.25rem,3vw,1.75rem)]";
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="contents">
      {/*
        The visual grid uses aria-hidden operator glyphs (see TermToken) so sighted
        users get natural mathematical typesetting; screen readers instead get the
        single, always-correct spoken sentence below. Exposing both would mean a
        screen reader either reads partial content (magnitudes with no +/-, since
        the operators are decorative here) or duplicates the announcement.
      */}
      <div
        aria-hidden="true"
        className={`grid grid-cols-[1fr_auto_1fr] items-baseline gap-1.5 sm:gap-2 font-math ${textSize}`}
      >
        <div className="flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-1">
          {renderSide(tree.left, "left", highlight, Boolean(prefersReducedMotion))}
        </div>
        <div className="px-1 text-ink-muted">=</div>
        <div className="flex flex-wrap items-baseline justify-start gap-x-1.5 gap-y-1">
          {renderSide(tree.right, "right", highlight, Boolean(prefersReducedMotion))}
        </div>
      </div>
      {announce && (
        <p className="sr-only" role="status" aria-live="polite">
          {spokenEquation(equation)}
        </p>
      )}
    </div>
  );
}

function renderSide(
  terms: FormattedTerm[],
  side: "left" | "right",
  highlight: HighlightedTerms,
  reduceMotion: boolean,
) {
  return (
    <>
      {terms.map((term, index) => {
        const isHighlighted = highlight?.side === side && highlight.indices.includes(index);
        return (
          <motion.span
            key={`${side}-${index}-${term.variable ?? "c"}`}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: EASE_IN_OUT }}
            className={
              isHighlighted
                ? "rounded-chip bg-accent-soft px-1.5 py-0.5 -mx-0.5 transition-colors duration-200"
                : undefined
            }
          >
            <TermToken term={term} />
          </motion.span>
        );
      })}
    </>
  );
}
