import { STEP_INFO, type StepNumber } from "@/content/method";

export function MethodRail({ currentStep }: { currentStep: StepNumber }) {
  return (
    <ol className="flex flex-col gap-2" aria-label="Method">
      {([1, 2, 3] as const).map((step) => {
        const info = STEP_INFO[step];
        const status = step < currentStep ? "done" : step === currentStep ? "active" : "upcoming";
        return (
          <li
            key={step}
            className={`rounded-control border p-3 transition-colors duration-200 ${
              status === "active"
                ? "border-accent bg-accent-soft"
                : status === "done"
                  ? "border-border bg-surface-sunken"
                  : "border-border bg-surface-raised"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-xs font-semibold tabular-nums ${
                  status === "active"
                    ? "bg-accent text-accent-contrast"
                    : status === "done"
                      ? "bg-success text-white"
                      : "border border-border-strong text-ink-faint"
                }`}
              >
                {status === "done" ? "✓" : step}
              </span>
              <span className={`text-sm font-semibold ${status === "upcoming" ? "text-ink-faint" : "text-ink"}`}>
                {info.title}
              </span>
            </div>
            {status === "active" && <p className="mt-1.5 pl-8 text-sm text-ink-muted">{info.goal}</p>}
          </li>
        );
      })}
    </ol>
  );
}
