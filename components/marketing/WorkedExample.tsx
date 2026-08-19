"use client";

import { useEffect, useState } from "react";
import { EquationHistory } from "@/components/equation/EquationHistory";
import { EquationLine } from "@/components/equation/EquationLine";
import { AutoFocusButton } from "@/components/ui/auto-focus-button";
import { FadeIn } from "@/components/ui/fade-in";
import { buildWorkedExample, WORKED_EXAMPLE_FRAMES, type WorkedExampleFrame } from "@/content/worked-example";
import { generateQuestion } from "@/domain/generator";
import { createSeededRandom } from "@/domain/random";

const BADGE_STYLE: Record<WorkedExampleFrame["kind"], string> = {
  start: "bg-surface-sunken text-ink-muted",
  rule: "bg-accent-soft text-ink",
  result: "bg-accent-soft text-ink",
  solved: "bg-success-soft text-success",
};

/** A fresh, easy-difficulty equation walkthrough, built from the same generator real practice sessions use. */
function randomFrames(): WorkedExampleFrame[] {
  const rng = createSeededRandom(Date.now() ^ Math.floor(Math.random() * 2 ** 31));
  return buildWorkedExample(generateQuestion("easy", rng).equation);
}

/**
 * A fully passive, narrated worked example: pressing "Next" advances through the
 * real solver's own step-by-step derivation (see content/worked-example.ts) one
 * frame at a time. Earlier equations stay visible in the history above, so the
 * whole derivation reads as one continuous story rather than a series of resets.
 * Starts on a fixed equation (stable for server rendering, avoiding a hydration
 * mismatch), then swaps to a fresh random one right after mount and again every
 * time the demo restarts, so repeat visitors don't see the same example forever.
 */
export function WorkedExample() {
  const [frames, setFrames] = useState<WorkedExampleFrame[]>(WORKED_EXAMPLE_FRAMES);
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const frame = frames[index];
  const isFinal = index === frames.length - 1;

  useEffect(() => {
    // Deferred to after mount: picking randomly during render would produce a
    // different equation on the server than on the client, causing a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrames(randomFrames());
  }, []);

  const history: (typeof frames)[number]["equation"][] = [];
  for (let i = 1; i <= index; i++) {
    if (frames[i].equation !== frames[i - 1].equation) {
      history.push(frames[i - 1].equation);
    }
  }

  function next() {
    // Briefly locked so a fast double-click can't fire a second equation
    // transition before the first term's enter/exit animation has settled.
    if (locked) return;
    setLocked(true);
    if (index >= frames.length - 1) {
      setFrames(randomFrames());
      setIndex(0);
    } else {
      setIndex(index + 1);
    }
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
