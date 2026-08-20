"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EquationLine } from "@/components/equation/EquationLine";
import { EquationHistory } from "@/components/equation/EquationHistory";
import { MethodRail } from "@/components/practice/MethodRail";
import { RuleBuilder } from "@/components/practice/RuleBuilder";
import { SimplificationPanel } from "@/components/practice/SimplificationPanel";
import { SessionHeader } from "@/components/practice/SessionHeader";
import { AutoFocusButton } from "@/components/ui/auto-focus-button";
import { FadeIn } from "@/components/ui/fade-in";
import { ruleFeedbackMessage, signCheckFeedbackMessage } from "@/content/feedback";
import { idealRuleForStep, isXCoefficientPositive } from "@/domain/evaluator";
import {
  canSkip,
  displayedEquation,
  reduceSession,
  summariseSession,
  type SessionEvent,
  type SessionState,
} from "@/state/session-machine";
import { clearActiveSession, saveActiveSession, saveCompletedSummary } from "@/state/persistence";

const OUTCOME_LABEL = {
  independent: "Solved independently",
  hint: "Solved with a hint",
  guidance: "Solved with guidance",
} as const;

export function PracticeSession({ initialState }: { initialState: SessionState }) {
  const [state, setState] = useState(initialState);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const savedSummaryRef = useRef(false);

  function dispatch(event: SessionEvent) {
    setState((prev) => {
      const next = reduceSession(prev, event);
      saveActiveSession(next);
      return next;
    });
  }

  useEffect(() => {
    if (state.phase.name === "session_complete" && !savedSummaryRef.current) {
      savedSummaryRef.current = true;
      const summary = summariseSession(state);
      saveCompletedSummary({ ...summary, difficulty: state.difficulty, completedAt: new Date().toISOString() });
      clearActiveSession();
      router.push("/results");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase.name]);

  const question = state.questions[state.currentQuestionIndex];
  const equation = displayedEquation(state);
  const phase = state.phase;

  if (phase.name === "session_complete") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-ink-muted">Wrapping up your session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader
        difficulty={state.difficulty}
        questionNumber={state.currentQuestionIndex + 1}
        questionCount={state.questions.length}
        combo={state.combo}
      />

      <div className="flex items-center justify-between border-b border-border px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "UNDO_SIMPLIFICATION" })}
          disabled={!(phase.name === "choose_simplification" && phase.resolvedIds.length > 0)}
          className="min-h-11 rounded-control px-3 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-30"
        >
          Undo last simplification
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="min-h-11 min-w-11 rounded-control px-3 text-ink-muted hover:text-ink"
            aria-label="More options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-10 mt-1 w-56 rounded-control border border-border bg-surface-raised p-1 shadow-lg">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  dispatch({ type: "RESTART_QUESTION" });
                }}
                className="min-h-11 w-full rounded-control px-3 text-left text-sm text-ink hover:bg-surface-sunken"
              >
                Restart this question
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 p-4 sm:p-6 md:grid-cols-[2fr_1fr]">
        <h1 className="sr-only">
          {state.difficulty} practice, question {state.currentQuestionIndex + 1} of {state.questions.length}
        </h1>
        <section className="rounded-stage border border-border bg-surface-raised p-4 sm:p-6">
          <EquationHistory history={state.stepHistory} />
          <EquationLine equation={equation} announce highlight={activeHighlight(state)} />

          {phase.name === "confirm_sign" && (
            <FadeIn className="mt-6 flex flex-col items-center gap-4">
              <p className="text-center text-ink">
                Is the <span className="font-math italic">x</span>-term positive?
              </p>
              {phase.lastFeedbackCategory === "wrong" && (
                <p
                  data-testid="sign-check-feedback"
                  role="status"
                  aria-live="assertive"
                  className="max-w-md text-center text-sm text-danger"
                >
                  {signCheckFeedbackMessage(isXCoefficientPositive(state.equation))}
                </p>
              )}
              <div className="flex gap-3">
                <AutoFocusButton
                  type="button"
                  onClick={() => dispatch({ type: "ANSWER_SIGN_CHECK", positive: true })}
                  className="min-h-11 min-w-24 rounded-control bg-accent px-5 py-2 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
                >
                  Yes
                </AutoFocusButton>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "ANSWER_SIGN_CHECK", positive: false })}
                  className="min-h-11 min-w-24 rounded-control border border-border bg-surface-sunken px-5 py-2 font-medium text-ink transition-colors duration-150 hover:border-border-strong"
                >
                  No
                </button>
              </div>
            </FadeIn>
          )}

          {phase.name === "rule_feedback" && (
            <FadeIn className="mt-6 flex flex-col items-center gap-3">
              <p role="status" aria-live="assertive" className="max-w-md text-center text-ink">
                {ruleFeedbackMessage(phase.category, idealRuleForStep(state.equation, state.currentStep))}
              </p>
              <AutoFocusButton
                type="button"
                onClick={() => dispatch({ type: "CONTINUE" })}
                className="min-h-11 rounded-control bg-accent px-5 py-2 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                Continue
              </AutoFocusButton>
            </FadeIn>
          )}

          {phase.name === "choose_simplification" && (
            <div className="mt-6">
              <SimplificationPanel
                targets={phase.targets}
                resolvedIds={phase.resolvedIds}
                selectedTargetId={phase.selectedTargetId}
                lastFeedbackCategory={phase.lastFeedbackCategory}
                dispatch={dispatch}
              />
            </div>
          )}

          {phase.name === "step_complete" && (
            <FadeIn className="mt-6 flex flex-col items-center gap-3">
              <p className="flex items-center gap-2 text-success">
                <span aria-hidden="true">✓</span>
                <span>Step complete.</span>
              </p>
              <AutoFocusButton
                type="button"
                onClick={() => dispatch({ type: "CONTINUE" })}
                className="min-h-11 rounded-control bg-accent px-5 py-2 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                Continue
              </AutoFocusButton>
            </FadeIn>
          )}

          {phase.name === "question_intro" && (
            <div className="mt-6 flex justify-center">
              <AutoFocusButton
                type="button"
                onClick={() => dispatch({ type: "CONTINUE" })}
                className="min-h-11 rounded-control bg-accent px-6 py-2 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                Begin
              </AutoFocusButton>
            </div>
          )}

          {phase.name === "question_complete" && (
            <FadeIn className="mt-6 flex flex-col items-center gap-3">
              <p className="flex items-center gap-2 text-lg font-medium text-ink">
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                Solved!
              </p>
              <p className="text-sm text-ink-muted">
                {OUTCOME_LABEL[
                  state.hintsUsedThisQuestion === 0 ? "independent" : state.hintsUsedThisQuestion >= 4 ? "guidance" : "hint"
                ]}
              </p>
              <AutoFocusButton
                type="button"
                onClick={() => dispatch({ type: "CONTINUE" })}
                className="min-h-11 rounded-control bg-accent px-5 py-2 font-medium text-accent-contrast transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                {state.currentQuestionIndex + 1 >= state.questions.length ? "See results" : "Next question"}
              </AutoFocusButton>
            </FadeIn>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <MethodRail currentStep={state.currentStep} />
          {phase.name === "enter_rule" && (
            <RuleBuilder
              key={state.currentStep}
              step={state.currentStep}
              equation={state.equation}
              hintLevel={phase.hintLevel}
              dispatch={dispatch}
              canSkip={canSkip(state)}
            />
          )}
        </aside>
      </main>

      <p className="sr-only" aria-hidden="true">
        {question.difficulty}
      </p>
    </div>
  );
}

function activeHighlight(state: SessionState) {
  const phase = state.phase;
  if (phase.name !== "choose_simplification") return null;
  const target = phase.targets.find((t) => t.id === phase.selectedTargetId);
  if (!target) return null;
  // Highlight indices are only meaningful pre-resolution; once resolved the terms have collapsed.
  if (phase.resolvedIds.includes(target.id)) return null;
  if (target.kind === "scale") {
    const index = Number(target.id.split("-scale-")[1]);
    return { side: target.side, indices: [index] };
  }
  return null;
}
