"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EquationLine } from "@/components/equation/EquationLine";
import { SpaceInvadersScene } from "@/components/marketing/SpaceInvadersScene";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { STEP_INFO } from "@/content/method";
import { constantTerm, xTerm, type Equation } from "@/domain/equation";
import type { Difficulty } from "@/domain/generator";
import { createSeededRandom } from "@/domain/random";
import { fromInt } from "@/domain/rational";
import { loadActiveSession, loadDifficulty, saveActiveSession, saveDifficulty } from "@/state/persistence";
import { createSession } from "@/state/session-machine";

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", label: "Easy", description: "Solutions 1–4, small numbers" },
  { value: "medium", label: "Medium", description: "Solutions 6–9, bigger numbers" },
  { value: "hard", label: "Hard", description: "Fractions and negatives" },
];

const PREVIEW_START: Equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
const PREVIEW_RESULT: Equation = { left: [xTerm(fromInt(2))], right: [constantTerm(fromInt(16))] };

export default function StartScreen() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [previewApplied, setPreviewApplied] = useState(false);

  useEffect(() => {
    // Deferred to after mount: localStorage isn't available during SSR, and reading
    // it during render would produce a client/server hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDifficulty(loadDifficulty() ?? "easy");
    const active = loadActiveSession();
    setHasActiveSession(Boolean(active && active.phase.name !== "session_complete"));
  }, []);

  function startSession() {
    saveDifficulty(difficulty);
    const rng = createSeededRandom(Date.now() ^ Math.floor(Math.random() * 2 ** 31));
    const session = createSession(difficulty, rng);
    saveActiveSession(session);
    router.push("/play");
  }

  function continueSession() {
    router.push("/play");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight text-ink">Algebra Arcade</span>
          <ThemeToggle />
        </div>
        <div className="overflow-hidden rounded-control">
          <SpaceInvadersScene variant="strip" />
        </div>
      </header>

      <main className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Solve equations the way that actually makes sense.
        </h1>
        <p className="max-w-md text-ink-muted">
          A calm, guided way to practise one-variable equations — choose a RULE, watch it apply to both sides, and
          simplify step by step.
        </p>
      </section>

      <section className="overflow-hidden rounded-stage border border-border">
        <SpaceInvadersScene variant="hero" />
      </section>

      <section className="rounded-stage border border-border bg-surface-raised p-6">
        <div className="flex flex-col items-center gap-4">
          <EquationLine equation={previewApplied ? PREVIEW_RESULT : PREVIEW_START} size="sm" />
          <button
            type="button"
            onClick={() => setPreviewApplied((v) => !v)}
            className="min-h-11 rounded-control border border-border bg-surface-sunken px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-border-strong"
          >
            {previewApplied ? "Reset" : "Try RULE: + 6"}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-muted">Difficulty</h2>
        <div role="group" aria-label="Difficulty" className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={difficulty === option.value}
              onClick={() => setDifficulty(option.value)}
              className={`min-h-16 rounded-control border p-3 text-left transition-colors duration-150 ${
                difficulty === option.value
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface-raised hover:border-border-strong"
              }`}
            >
              <div className="font-semibold text-ink">{option.label}</div>
              <div className="text-xs text-ink-muted">{option.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        {hasActiveSession ? (
          <>
            <button
              type="button"
              onClick={continueSession}
              className="min-h-11 w-full max-w-xs rounded-control bg-accent px-6 py-3 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
            >
              Continue session
            </button>
            <button type="button" onClick={startSession} className="text-sm font-medium text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink">
              Start a new session
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startSession}
            className="min-h-11 w-full max-w-xs rounded-control bg-accent px-6 py-3 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            Start practice
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowMethod((v) => !v)}
          aria-expanded={showMethod}
          className="text-sm font-medium text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink"
        >
          How the 3-step method works
        </button>
        {showMethod && (
          <ol className="mt-2 flex w-full max-w-md flex-col gap-2">
            {([1, 2, 3] as const).map((step) => (
              <li key={step} className="rounded-control border border-border bg-surface-sunken p-3">
                <p className="text-sm font-semibold text-ink">
                  {step}. {STEP_INFO[step].title}
                </p>
                <p className="text-sm text-ink-muted">{STEP_INFO[step].goal}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      </main>
    </div>
  );
}
