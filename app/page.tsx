"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SpaceInvadersScene } from "@/components/marketing/SpaceInvadersScene";
import { WorkedExample } from "@/components/marketing/WorkedExample";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { STEP_INFO } from "@/content/method";
import type { Difficulty } from "@/domain/generator";
import { createSeededRandom } from "@/domain/random";
import { loadActiveSession, loadDifficulty, saveActiveSession, saveDifficulty } from "@/state/persistence";
import { createSession } from "@/state/session-machine";

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", label: "Easy", description: "Solutions 1–4, small numbers" },
  { value: "medium", label: "Medium", description: "Solutions 6–9, bigger numbers" },
  { value: "hard", label: "Hard", description: "Fractions and negatives" },
];

export default function StartScreen() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

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
    <div className="min-h-dvh w-full xl:grid xl:grid-cols-[1fr_minmax(0,48rem)_1fr]">
      <aside className="hidden xl:block" aria-hidden="true">
        <div className="sticky top-0 h-dvh">
          <SpaceInvadersScene variant="side" />
        </div>
      </aside>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="shrink-0 text-xl font-semibold tracking-tight text-ink">Algebra Arcade</span>
        <div className="min-w-[100px] flex-1 overflow-hidden rounded-control">
          <SpaceInvadersScene variant="strip" />
        </div>
        <ThemeToggle />
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

      <section className="overflow-hidden rounded-stage border border-border xl:hidden">
        <SpaceInvadersScene variant="hero" />
      </section>

      <WorkedExample />

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

      <aside className="hidden xl:block" aria-hidden="true">
        <div className="sticky top-0 h-dvh">
          <SpaceInvadersScene variant="side" />
        </div>
      </aside>
    </div>
  );
}
