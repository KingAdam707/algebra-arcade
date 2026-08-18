"use client";

import { useEffect, useRef, useState } from "react";
import type { Equation, Rule } from "@/domain/equation";
import { idealRuleForStep } from "@/domain/evaluator";
import { fromInt } from "@/domain/rational";
import { hintText } from "@/content/method";
import { EMPTY_NUMERIC_ENTRY, NumberPad, isNumericEntryComplete, numericEntryToRaw, type NumericEntryValue } from "./NumberPad";
import type { HintLevel, SessionEvent, StepNumber } from "@/state/session-machine";

type AddSubtractOp = "add" | "subtract";

export function RuleBuilder({
  step,
  equation,
  hintLevel,
  dispatch,
  canSkip,
}: {
  step: StepNumber;
  equation: Equation;
  hintLevel: HintLevel;
  dispatch: (event: SessionEvent) => void;
  canSkip: boolean;
}) {
  const isDivideStep = step === 3;
  // The parent mounts this component with key={step}, so a step change remounts
  // it fresh rather than needing an effect to reset operation/entry state.
  const [operation, setOperation] = useState<AddSubtractOp>("add");
  const [entry, setEntry] = useState<NumericEntryValue>(EMPTY_NUMERIC_ENTRY);

  // This panel also remounts on a retry after incorrect feedback (the enter_rule
  // phase is conditionally rendered), so move focus here each time it appears
  // rather than letting it silently fall back to <body>.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const idealRule = idealRuleForStep(equation, step);
  const canSubmit = isNumericEntryComplete(entry) && entry.numerator !== "0";

  function buildRule(): Rule {
    const raw = numericEntryToRaw(entry);
    const magnitude = Math.abs(raw.numerator);
    if (isDivideStep) {
      return { kind: "divide", value: fromInt(magnitude === 0 ? 1 : magnitude) };
    }
    return {
      kind: operation,
      term: { coefficient: fromInt(magnitude), variable: step === 1 && entry.variable ? "x" : null },
    };
  }

  function submit() {
    if (!canSubmit) return;
    dispatch({ type: "SUBMIT_RULE", rule: buildRule() });
  }

  const previewText = previewFor(step, operation, entry, isDivideStep);

  return (
    <div className="rounded-stage border border-border bg-surface-raised p-4 sm:p-5">
      <h2 ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-ink-muted">
        RULE
      </h2>

      <div className="mt-3 flex flex-col items-center gap-4">
        {!isDivideStep && (
          <div role="group" aria-label="Operation" className="inline-flex gap-1 rounded-pill border border-border bg-surface-sunken p-0.5">
            {(["add", "subtract"] as const).map((op) => (
              <button
                key={op}
                type="button"
                data-testid={`rule-op-${op}`}
                onClick={() => setOperation(op)}
                aria-pressed={operation === op}
                aria-label={op === "add" ? "Add" : "Subtract"}
                className={`min-h-9 min-w-11 rounded-pill px-3 text-lg font-medium transition-colors duration-150 ${
                  operation === op ? "bg-accent text-accent-contrast" : "text-ink-muted hover:text-ink"
                }`}
              >
                {op === "add" ? "+" : "−"}
              </button>
            ))}
          </div>
        )}

        {isDivideStep && (
          <div aria-hidden="true" className="text-lg font-medium text-ink-muted">
            ÷
          </div>
        )}

        <NumberPad
          label="Enter the number for this RULE"
          value={entry}
          onChange={setEntry}
          allowVariable={step === 1}
        />

        <p className="font-math text-xl text-ink" aria-live="polite">
          RULE: <span className="font-semibold">{previewText}</span>
        </p>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="min-h-11 rounded-control bg-accent px-4 py-2 font-medium text-accent-contrast transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-40"
          >
            Apply to both sides
          </button>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => dispatch({ type: "REQUEST_HINT" })}
              disabled={hintLevel >= 4}
              className="min-h-11 rounded-control px-3 text-sm font-medium text-accent underline decoration-dotted underline-offset-4 disabled:text-ink-faint disabled:no-underline"
            >
              Hint
            </button>
            {canSkip && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SKIP_QUESTION" })}
                className="min-h-11 rounded-control px-3 text-sm font-medium text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink"
              >
                Skip
              </button>
            )}
          </div>
        </div>

        {hintLevel !== 0 && (
          <p role="status" aria-live="polite" className="rounded-control bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
            {hintText(hintLevel, step, idealRule)}
          </p>
        )}
      </div>
    </div>
  );
}

function previewFor(step: StepNumber, operation: AddSubtractOp, entry: NumericEntryValue, isDivideStep: boolean): string {
  const magnitude = entry.numerator || "0";
  if (isDivideStep) return `÷ ${magnitude}`;
  const sign = operation === "add" ? "+" : "−";
  const suffix = step === 1 && entry.variable ? "x" : "";
  return `${sign} ${magnitude}${suffix}`;
}
