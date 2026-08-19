"use client";

import { useState } from "react";
import { EquationHistory } from "@/components/equation/EquationHistory";
import { EquationLine } from "@/components/equation/EquationLine";
import { AutoFocusButton } from "@/components/ui/auto-focus-button";
import { FadeIn } from "@/components/ui/fade-in";
import { WORKED_EXAMPLE_FRAMES } from "@/content/worked-example";

const BADGE_STYLE: Record<(typeof WORKED_EXAMPLE_FRAMES)[number]["kind"], string> = {
  start: "bg-surface-sunken text-ink-muted",
  rule: "bg-accent-soft text-ink",
  result: "bg-accent-soft text-ink",
  solved: "bg-success-soft text-success",
};

/**
 * A fully passive, narrated worked example: pressing "Next" advances through the
 * real solver's own step-by-step derivation (see content/worked-example.ts) one
 * frame at a time. Earlier equations stay visible in the history above, so the
 * whole derivation reads as one continuous story rather than a series of resets.
 */
export function WorkedExample() {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const frame = WORKED_EXAMPLE_FRAMES[index];
  const isFinal = index === WORKED_EXAMPLE_FRAMES.length - 1;

  const history: typeof WORKED_EXAMPLE_FRAMES[number]["equation"][] = [];
  for (let i = 1; i <= index; i++) {
    if (WORKED_EXAMPLE_FRAMES[i].equation !== WORKED_EXAMPLE_FRAMES[i - 1].equation) {
      history.push(WORKED_EXAMPLE_FRAMES[i - 1].equation);
    }
  }

  function next() {
    // Briefly locked so a fast double-click can't fire a second equation
    // transition before the first term's enter/exit animation has settled.
    if (locked) return;
    setLocked(true);
    setIndex((i) => (i >= WORKED_EXAMPLE_FRAMES.length - 1 ? 0 : i + 1));
    window.setTimeout(() => setLocked(false), 350);
  }

  return (
    <section className="rounded-stage border border-border bg-surface-raised p-6">
      <div className="flex flex-col items-center gap-4">
        <EquationHistory history={history} />
        <EquationLine equation={frame.equation} size="sm" />

        <FadeIn key={`text-${frame.id}`} className="flex flex-col items-center gap-3 text-center">
          <span className={`rounded-chip px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${BADGE_STYLE[frame.kind]}`}>
            {frame.badge}
          </span>
          <p className="max-w-md text-sm text-ink-muted">{frame.explanation}</p>
        </FadeIn>

        {index === 0 ? (
          <button
            type="button"
            onClick={next}
            disabled={locked}
            className="min-h-11 rounded-control border border-border bg-surface-sunken px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-border-strong disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          // Not disabled while locked: a disabled button can't receive focus, which
          // would break AutoFocusButton's focus-follows-the-flow behaviour on every
          // step after the first. The `next()` guard alone prevents double-firing.
          <AutoFocusButton
            key={`button-${frame.id}`}
            type="button"
            onClick={next}
            className="min-h-11 rounded-control border border-border bg-surface-sunken px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-border-strong"
          >
            {isFinal ? "Restart example" : "Next"}
          </AutoFocusButton>
        )}
      </div>
    </section>
  );
}
