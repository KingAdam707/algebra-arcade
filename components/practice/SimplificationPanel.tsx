"use client";

import { useEffect, useRef, useState } from "react";
import { formatSide } from "@/domain/formatter";
import { toDisplayString } from "@/domain/rational";
import { TermToken } from "@/components/equation/TermToken";
import {
  EMPTY_NUMERIC_ENTRY,
  NumberPad,
  isNumericEntryComplete,
  numericEntryToRaw,
  type NumericEntryValue,
} from "./NumberPad";
import type { SessionEvent, SimplificationTarget } from "@/state/session-machine";
import type { SimplificationFeedbackCategory } from "@/domain/evaluator";
import { SIMPLIFICATION_FEEDBACK } from "@/content/feedback";

function targetPreview(target: SimplificationTarget) {
  const terms = formatSide(target.beforeTerms);
  if (target.kind === "merge") {
    return (
      <span className="inline-flex items-baseline gap-1 font-math">
        {terms.map((term, index) => (
          <TermToken key={index} term={term} />
        ))}
      </span>
    );
  }
  const operatorSymbol = target.operation?.kind === "multiply" ? "×" : "÷";
  return (
    <span className="inline-flex items-baseline gap-1.5 font-math">
      <TermToken term={terms[0]} />
      <span aria-hidden="true">{operatorSymbol}</span>
      <span aria-hidden="true">{target.operation ? toDisplayString(target.operation.value) : ""}</span>
    </span>
  );
}

/**
 * TermToken hides its operator glyphs from the accessibility tree (EquationLine
 * supplies the natural-language reading separately), so a button built from
 * TermTokens needs its own explicit label — otherwise a screen reader gets only
 * the bare magnitudes with no operator, e.g. "6 2" instead of "6 divided by 2".
 */
function targetAriaLabel(target: SimplificationTarget): string {
  const terms = formatSide(target.beforeTerms);
  if (target.kind === "merge") {
    return terms.map((t) => t.spokenText).join(" ");
  }
  const operationWord = target.operation?.kind === "multiply" ? "multiplied by" : "divided by";
  const operand = target.operation ? toDisplayString(target.operation.value) : "";
  return `${terms[0].spokenText} ${operationWord} ${operand}`;
}

export function SimplificationPanel({
  targets,
  resolvedIds,
  selectedTargetId,
  lastFeedbackCategory,
  dispatch,
}: {
  targets: SimplificationTarget[];
  resolvedIds: string[];
  selectedTargetId: string | null;
  lastFeedbackCategory: SimplificationFeedbackCategory | null;
  dispatch: (event: SessionEvent) => void;
}) {
  const [entry, setEntry] = useState<NumericEntryValue>(EMPTY_NUMERIC_ENTRY);
  const pending = targets.filter((t) => !resolvedIds.includes(t.id));
  const selected = targets.find((t) => t.id === selectedTargetId) ?? null;

  // This panel mounts fresh each time the learner enters choose_simplification,
  // so move focus here rather than letting it fall back to <body>.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function selectTarget(id: string) {
    setEntry(EMPTY_NUMERIC_ENTRY);
    dispatch({ type: "SELECT_SIMPLIFICATION_TARGET", targetId: id });
  }

  function submit() {
    if (!selected || !isNumericEntryComplete(entry)) return;
    const raw = numericEntryToRaw(entry);
    dispatch({
      type: "SUBMIT_SIMPLIFICATION",
      targetId: selected.id,
      answer: { numerator: raw.numerator, denominator: raw.denominator, variable: entry.variable },
    });
    setEntry(EMPTY_NUMERIC_ENTRY);
  }

  if (pending.length === 0) return null;

  const allowFraction = selected ? selected.expected.coefficient.denominator !== 1 : false;
  const involvesVariable = selected
    ? selected.expected.variable === "x" || selected.beforeTerms.some((t) => t.variable === "x")
    : false;

  return (
    <div className="rounded-stage border border-border bg-surface-raised p-4 sm:p-5">
      <h2 ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-ink-muted">
        Simplify
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {pending.map((target) => (
          <button
            key={target.id}
            type="button"
            data-testid={`simplify-target-${target.id}`}
            onClick={() => selectTarget(target.id)}
            aria-pressed={selected?.id === target.id}
            aria-label={targetAriaLabel(target)}
            className={`min-h-11 rounded-chip border px-3 py-2 text-lg transition-colors duration-150 ${
              selected?.id === target.id
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface-sunken hover:border-border-strong"
            }`}
          >
            {targetPreview(target)}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 flex flex-col items-center gap-3 border-t border-border pt-4">
          <NumberPad
            label="Enter the simplified value"
            value={entry}
            onChange={setEntry}
            allowNegative
            allowFraction={allowFraction}
            allowVariable={involvesVariable}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!isNumericEntryComplete(entry)}
            className="min-h-11 w-full max-w-xs rounded-control bg-accent px-4 py-2 font-medium text-accent-contrast transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-40"
          >
            Confirm
          </button>
          {lastFeedbackCategory && lastFeedbackCategory !== "correct" && (
            <p role="status" aria-live="polite" className="text-sm text-ink-muted">
              {SIMPLIFICATION_FEEDBACK[lastFeedbackCategory]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
