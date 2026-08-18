import { describe, expect, it } from "vitest";
import { constantTerm, xTerm } from "@/domain/equation";
import { plainTextEquation } from "@/domain/formatter";
import { fromInt } from "@/domain/rational";
import type { GeneratedQuestion } from "@/domain/generator";
import {
  createSessionFromQuestions,
  displayedEquation,
  isEquationSolved,
  reduceSession,
  summariseSession,
  type SessionState,
} from "@/state/session-machine";

function question(overrides: Partial<GeneratedQuestion>): GeneratedQuestion {
  return {
    equation: { left: [], right: [] },
    solution: fromInt(0),
    difficulty: "easy",
    startingCoefficientSign: "positive",
    xOnLeft: true,
    ...overrides,
  };
}

describe("session machine: canonical example 1 (2x - 6 = 10)", () => {
  const q = question({
    equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] },
    solution: fromInt(8),
    startingCoefficientSign: "positive",
  });

  it("walks the full RULE, apply-to-both-sides, guided-simplification flow via the reducer", () => {
    let state: SessionState = createSessionFromQuestions("easy", [q]);
    expect(plainTextEquation(state.equation)).toBe("2x - 6 = 10");

    // Step 1 is already positive, so this should auto-skip straight to step 2's enter_rule.
    state = reduceSession(state, { type: "CONTINUE" });
    expect(state.phase.name).toBe("enter_rule");
    expect(state.currentStep).toBe(2);

    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "add", term: constantTerm(fromInt(6)) } });
    expect(state.phase.name).toBe("rule_feedback");
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");

    state = reduceSession(state, { type: "CONTINUE" }); // -> choose_simplification
    expect(state.phase.name).toBe("choose_simplification");
    expect(plainTextEquation(displayedEquation(state))).toBe("2x - 6 + 6 = 10 + 6");

    if (state.phase.name !== "choose_simplification") throw new Error("unreachable");
    const targetIds = state.phase.targets.map((t) => t.id);
    expect(targetIds).toEqual(["left-merge", "right-merge"]);

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-merge",
      answer: { numerator: 0, denominator: 1, variable: false },
    });
    expect(plainTextEquation(displayedEquation(state))).toBe("2x = 10 + 6");

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "right-merge",
      answer: { numerator: 16, denominator: 1, variable: false },
    });
    expect(state.phase.name).toBe("step_complete");
    expect(plainTextEquation(state.equation)).toBe("2x = 16");

    state = reduceSession(state, { type: "CONTINUE" }); // -> step 3 enter_rule
    expect(state.phase.name).toBe("enter_rule");
    expect(state.currentStep).toBe(3);

    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "divide", value: fromInt(2) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");

    state = reduceSession(state, { type: "CONTINUE" }); // -> choose_simplification
    expect(plainTextEquation(displayedEquation(state))).toBe("2x = 16"); // scale targets don't pre-expand the text

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-scale-0",
      answer: { numerator: 1, denominator: 1, variable: true },
    });
    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "right-scale-0",
      answer: { numerator: 8, denominator: 1, variable: false },
    });
    expect(state.phase.name).toBe("step_complete");
    expect(plainTextEquation(state.equation)).toBe("x = 8");
    expect(isEquationSolved(state.equation)).toBe(true);

    state = reduceSession(state, { type: "CONTINUE" }); // -> question_complete
    expect(state.phase.name).toBe("question_complete");

    state = reduceSession(state, { type: "CONTINUE" }); // -> session_complete
    expect(state.phase.name).toBe("session_complete");
    expect(state.records).toHaveLength(1);
    expect(state.records[0].outcome).toBe("independent");
  });
});

describe("session machine: canonical example 2 (24 - 4x = 8)", () => {
  const q = question({
    equation: { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] },
    solution: fromInt(4),
    startingCoefficientSign: "negative",
  });

  it("walks the full flow including the step-1 sign-fix rule", () => {
    let state: SessionState = createSessionFromQuestions("easy", [q]);

    state = reduceSession(state, { type: "CONTINUE" }); // -> enter_rule (step 1 needed)
    expect(state.phase.name).toBe("enter_rule");
    expect(state.currentStep).toBe(1);

    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "add", term: xTerm(fromInt(4)) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");

    state = reduceSession(state, { type: "CONTINUE" }); // -> choose_simplification
    expect(plainTextEquation(displayedEquation(state))).toBe("24 - 4x + 4x = 8 + 4x");
    if (state.phase.name !== "choose_simplification") throw new Error("unreachable");
    // Only the left side has a matching x-term to merge; the right side had none, so no target there.
    expect(state.phase.targets.map((t) => t.id)).toEqual(["left-merge"]);

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-merge",
      answer: { numerator: 0, denominator: 1, variable: false },
    });
    expect(state.phase.name).toBe("step_complete");
    expect(plainTextEquation(state.equation)).toBe("24 = 8 + 4x");

    state = reduceSession(state, { type: "CONTINUE" }); // -> step 2 enter_rule
    expect(state.currentStep).toBe(2);

    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "subtract", term: constantTerm(fromInt(8)) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");

    state = reduceSession(state, { type: "CONTINUE" });
    expect(plainTextEquation(displayedEquation(state))).toBe("24 - 8 = 8 + 4x - 8");
    if (state.phase.name !== "choose_simplification") throw new Error("unreachable");
    expect(state.phase.targets.map((t) => t.id).sort()).toEqual(["left-merge", "right-merge"]);

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-merge",
      answer: { numerator: 16, denominator: 1, variable: false },
    });
    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "right-merge",
      answer: { numerator: 0, denominator: 1, variable: false },
    });
    expect(plainTextEquation(state.equation)).toBe("16 = 4x");

    state = reduceSession(state, { type: "CONTINUE" }); // -> step 3
    expect(state.currentStep).toBe(3);
    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "divide", value: fromInt(4) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");

    state = reduceSession(state, { type: "CONTINUE" });
    if (state.phase.name !== "choose_simplification") throw new Error("unreachable");
    expect(state.phase.targets.map((t) => t.id).sort()).toEqual(["left-scale-0", "right-scale-0"]);

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-scale-0",
      answer: { numerator: 4, denominator: 1, variable: false },
    });
    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "right-scale-0",
      answer: { numerator: 1, denominator: 1, variable: true },
    });
    expect(state.phase.name).toBe("step_complete");
    expect(plainTextEquation(state.equation)).toBe("4 = x");
    expect(isEquationSolved(state.equation)).toBe(true);

    state = reduceSession(state, { type: "CONTINUE" });
    state = reduceSession(state, { type: "CONTINUE" });
    expect(state.phase.name).toBe("session_complete");
    expect(state.records[0].outcome).toBe("independent");
  });
});

describe("session machine: mistakes, hints, undo, and skip", () => {
  const q = question({
    equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] },
    solution: fromInt(8),
  });

  it("lets the learner retry after an incorrect rule and tracks hint usage", () => {
    let state: SessionState = createSessionFromQuestions("easy", [q]);
    state = reduceSession(state, { type: "CONTINUE" }); // -> enter_rule, step 2

    // Sign error: -6 instead of +6.
    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "subtract", term: constantTerm(fromInt(6)) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("sign-error");

    state = reduceSession(state, { type: "CONTINUE" }); // back to enter_rule for another attempt
    expect(state.phase.name).toBe("enter_rule");
    expect(state.phase.name === "enter_rule" && state.phase.lastFeedbackCategory).toBe("sign-error");

    state = reduceSession(state, { type: "REQUEST_HINT" });
    state = reduceSession(state, { type: "REQUEST_HINT" });
    expect(state.hintsUsedThisQuestion).toBe(2);
    expect(state.phase.name === "enter_rule" && state.phase.hintLevel).toBe(2);

    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "add", term: constantTerm(fromInt(6)) } });
    expect(state.phase.name === "rule_feedback" && state.phase.category).toBe("correct");
  });

  it("supports undo of a resolved simplification target", () => {
    let state: SessionState = createSessionFromQuestions("easy", [q]);
    state = reduceSession(state, { type: "CONTINUE" }); // -> enter_rule, step 2
    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "add", term: constantTerm(fromInt(6)) } });
    state = reduceSession(state, { type: "CONTINUE" });

    state = reduceSession(state, {
      type: "SUBMIT_SIMPLIFICATION",
      targetId: "left-merge",
      answer: { numerator: 0, denominator: 1, variable: false },
    });
    expect(plainTextEquation(displayedEquation(state))).toBe("2x = 10 + 6");

    state = reduceSession(state, { type: "UNDO_SIMPLIFICATION" });
    expect(plainTextEquation(displayedEquation(state))).toBe("2x - 6 + 6 = 10 + 6");
  });
});

describe("summariseSession", () => {
  it("reports the strongest and weakest skill by first-try accuracy", () => {
    let state: SessionState = createSessionFromQuestions("easy", [
      question({ equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] }, solution: fromInt(8) }),
    ]);
    state = reduceSession(state, { type: "CONTINUE" }); // -> enter_rule, step 2
    // Wrong first, showing this skill is weaker.
    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "subtract", term: constantTerm(fromInt(6)) } });
    state = reduceSession(state, { type: "CONTINUE" });
    state = reduceSession(state, { type: "SUBMIT_RULE", rule: { kind: "add", term: constantTerm(fromInt(6)) } });

    const summary = summariseSession(state);
    expect(summary.skillTallies["choose-inverse"].attempts).toBe(1);
    expect(summary.skillTallies["choose-inverse"].correctFirstTry).toBe(0);
  });
});
