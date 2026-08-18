import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Difficulty } from "@/domain/generator";

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function SessionHeader({
  difficulty,
  questionNumber,
  questionCount,
  combo,
}: {
  difficulty: Difficulty;
  questionNumber: number;
  questionCount: number;
  combo: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
      <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
        Algebra Arcade
      </Link>

      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="rounded-pill border border-border bg-surface-sunken px-2.5 py-1 font-medium">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
        <span aria-live="polite">
          Question {questionNumber} of {questionCount}
        </span>
        <ProgressTrack current={questionNumber} total={questionCount} />
        {combo >= 3 && (
          <span className="rounded-pill bg-accent-soft px-2.5 py-1 font-medium text-accent-strong">
            {combo} in a row
          </span>
        )}
      </div>

      <ThemeToggle />
    </header>
  );
}

function ProgressTrack({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label="Session progress"
      className="hidden gap-1 sm:flex"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-4 rounded-pill ${index < current ? "bg-accent" : "bg-surface-sunken"}`}
        />
      ))}
    </div>
  );
}
