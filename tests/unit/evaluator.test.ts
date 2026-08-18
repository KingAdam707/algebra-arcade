import { describe, expect, it } from "vitest";
import { constantTerm, xTerm } from "@/domain/equation";
import {
  classifyRuleAttempt,
  classifySimplificationAttempt,
  expectedTermForMergeGroup,
  idealRuleForStep,
  isCancellationGroup,
} from "@/domain/evaluator";
import { fromInt, makeRational } from "@/domain/rational";

describe("idealRuleForStep", () => {
  it("returns null for step 1 when the coefficient is already positive", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(idealRuleForStep(equation, 1)).toBeNull();
  });

  it("returns the matching positive x-term for step 1 when negative", () => {
    const equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    expect(idealRuleForStep(equation, 1)).toEqual({ kind: "add", term: xTerm(fromInt(4)) });
  });

  it("returns the inverse of the blocking constant for step 2", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(idealRuleForStep(equation, 2)).toEqual({ kind: "add", term: constantTerm(fromInt(6)) });
  });

  it("returns division by the coefficient for step 3", () => {
    const equation = { left: [xTerm(fromInt(2))], right: [constantTerm(fromInt(16))] };
    expect(idealRuleForStep(equation, 3)).toEqual({ kind: "divide", value: fromInt(2) });
  });
});

describe("classifyRuleAttempt", () => {
  const isolateExample = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };

  it("classifies the correct rule", () => {
    const result = classifyRuleAttempt(isolateExample, 2, { kind: "add", term: constantTerm(fromInt(6)) });
    expect(result.category).toBe("correct");
  });

  it("classifies a sign error: same magnitude, wrong direction", () => {
    const result = classifyRuleAttempt(isolateExample, 2, { kind: "subtract", term: constantTerm(fromInt(6)) });
    expect(result.category).toBe("sign-error");
  });

  it("classifies a magnitude error: correct direction, wrong number", () => {
    const result = classifyRuleAttempt(isolateExample, 2, { kind: "add", term: constantTerm(fromInt(5)) });
    expect(result.category).toBe("magnitude-error");
  });

  it("classifies a missing-variable error in step 1", () => {
    const equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    const result = classifyRuleAttempt(equation, 1, { kind: "add", term: constantTerm(fromInt(4)) });
    expect(result.category).toBe("missing-variable");
  });

  it("classifies premature division during step 1 or 2", () => {
    const result = classifyRuleAttempt(isolateExample, 2, { kind: "divide", value: fromInt(2) });
    expect(result.category).toBe("premature-division");
  });

  it("classifies an unrelated but balance-preserving rule as unhelpful-valid", () => {
    const result = classifyRuleAttempt(isolateExample, 2, { kind: "add", term: constantTerm(fromInt(100)) });
    expect(result.category).toBe("unhelpful-valid");
  });

  it("classifies the correct divisor in step 3", () => {
    const equation = { left: [xTerm(fromInt(4))], right: [constantTerm(fromInt(16))] };
    const result = classifyRuleAttempt(equation, 3, { kind: "divide", value: fromInt(4) });
    expect(result.category).toBe("correct");
  });

  it("classifies a wrong divisor in step 3 as a magnitude error", () => {
    const equation = { left: [xTerm(fromInt(4))], right: [constantTerm(fromInt(16))] };
    const result = classifyRuleAttempt(equation, 3, { kind: "divide", value: fromInt(2) });
    expect(result.category).toBe("magnitude-error");
  });
});

describe("classifySimplificationAttempt (merge groups)", () => {
  function classifyMerge(terms: ReturnType<typeof constantTerm>[], answer: { numerator: number; denominator: number; variable: boolean }) {
    const group = { terms };
    return classifySimplificationAttempt(expectedTermForMergeGroup(group), answer, {
      isCancellation: isCancellationGroup(group),
    });
  }

  it("accepts the correct sum", () => {
    const result = classifyMerge(
      [constantTerm(fromInt(10)), constantTerm(fromInt(6))],
      { numerator: 16, denominator: 1, variable: false },
    );
    expect(result.category).toBe("correct");
  });

  it("flags an arithmetic error", () => {
    const result = classifyMerge(
      [constantTerm(fromInt(10)), constantTerm(fromInt(6))],
      { numerator: 17, denominator: 1, variable: false },
    );
    expect(result.category).toBe("arithmetic-error");
  });

  it("flags a zero-cancellation error for constants", () => {
    const result = classifyMerge(
      [constantTerm(fromInt(-6)), constantTerm(fromInt(6))],
      { numerator: 6, denominator: 1, variable: false },
    );
    expect(result.category).toBe("zero-cancellation-error");
  });

  it("accepts 0 or 0x for a cancelled x-term group", () => {
    const asZero = classifyMerge([xTerm(fromInt(-4)), xTerm(fromInt(4))], { numerator: 0, denominator: 1, variable: false });
    const asZeroX = classifyMerge([xTerm(fromInt(-4)), xTerm(fromInt(4))], { numerator: 0, denominator: 1, variable: true });
    expect(asZero.category).toBe("correct");
    expect(asZeroX.category).toBe("correct");
  });

  it("flags a missing variable when the group needed one", () => {
    const result = classifyMerge(
      [xTerm(fromInt(4)), xTerm(fromInt(2))],
      { numerator: 6, denominator: 1, variable: false },
    );
    expect(result.category).toBe("missing-variable");
  });
});

describe("classifySimplificationAttempt (scale targets, e.g. 2x ÷ 2 -> x)", () => {
  it("accepts the correctly scaled term", () => {
    const expected = xTerm(fromInt(1));
    const result = classifySimplificationAttempt(expected, { numerator: 1, denominator: 1, variable: true });
    expect(result.category).toBe("correct");
  });

  it("flags a fraction numerator/denominator swap", () => {
    const expected = constantTerm(makeRational(7, 2));
    const result = classifySimplificationAttempt(expected, { numerator: 2, denominator: 7, variable: false });
    expect(result.category).toBe("fraction-error");
  });

  it("flags an unreduced fraction even though the value is right", () => {
    const expected = constantTerm(makeRational(1, 2));
    const result = classifySimplificationAttempt(expected, { numerator: 2, denominator: 4, variable: false });
    expect(result.category).toBe("fraction-error");
  });
});
