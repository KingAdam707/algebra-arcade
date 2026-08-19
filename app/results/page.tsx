"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpaceInvadersScene } from "@/components/marketing/SpaceInvadersScene";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SKILL_LABELS, createSession, type SkillId } from "@/state/session-machine";
import { createSeededRandom } from "@/domain/random";
import { loadCompletedSummaries, saveActiveSession, type StoredSummary } from "@/state/persistence";

export default function ResultsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<StoredSummary | null | undefined>(undefined);

  useEffect(() => {
    // Deferred to after mount: localStorage isn't available during SSR, and reading
    // it during render would produce a client/server hydration mismatch.
    const stored = loadCompletedSummaries();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(stored[0] ?? null);
  }, []);

  function practiseAgain() {
    if (!summary) return;
    const rng = createSeededRandom(Date.now() ^ Math.floor(Math.random() * 2 ** 31));
    saveActiveSession(createSession(summary.difficulty, rng));
    router.push("/play");
  }

  if (summary === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (summary === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-ink-muted">No session results yet.</p>
        <Link href="/" className="min-h-11 rounded-control bg-accent px-5 py-2 font-medium text-accent-contrast">
          Start practising
        </Link>
      </div>
    );
  }

  const skillEntries = (Object.entries(summary.skillTallies) as [SkillId, StoredSummary["skillTallies"][SkillId]][]).filter(
    ([, tally]) => tally.attempts > 0,
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-ink">
          Algebra Arcade
        </Link>
        <div className="min-w-[100px] flex-1 overflow-hidden rounded-control">
          <SpaceInvadersScene variant="strip" />
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-8">
      <h1 className="sr-only">Session results</h1>

      <section className="rounded-stage border border-border bg-surface-raised p-6 text-center">
        <p className="text-4xl font-semibold tabular-nums text-ink">{summary.questionsSolved}</p>
        <p className="mt-1 text-ink-muted">equations solved</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-control border border-border bg-surface-sunken p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Strongest skill</p>
          <p className="mt-1 font-medium text-ink">
            {summary.strongestSkill ? SKILL_LABELS[summary.strongestSkill] : "Not enough data yet"}
          </p>
        </div>
        <div className="rounded-control border border-border bg-surface-sunken p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Practise next</p>
          <p className="mt-1 font-medium text-ink">
            {summary.weakestSkill ? SKILL_LABELS[summary.weakestSkill] : "Not enough data yet"}
          </p>
        </div>
      </section>

      {skillEntries.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-muted">Skill breakdown</h2>
          {skillEntries.map(([skill, tally]) => (
            <div key={skill} className="flex items-center justify-between rounded-control border border-border bg-surface-raised px-3 py-2">
              <span className="text-sm text-ink">{SKILL_LABELS[skill]}</span>
              <span className="text-sm tabular-nums text-ink-muted">
                {tally.correctFirstTry}/{tally.attempts}
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={practiseAgain}
          className="min-h-11 w-full max-w-xs rounded-control bg-accent px-6 py-3 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          Practise this skill
        </button>
        <Link href="/" className="text-sm font-medium text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink">
          Finish for now
        </Link>
      </section>
      </main>
    </div>
  );
}
