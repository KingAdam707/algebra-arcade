import { describe, expect, it } from "vitest";
import { applyRuleToBothSides, canonicaliseEquation, constantTerm, xTerm } from "@/domain/equation";
import { plainTextEquation } from "@/domain/formatter";
import { fromInt } from "@/domain/rational";
import { solveEquation, verifyBySubstitution } from "@/domain/solver";

describe("canonical example 1: 2x - 6 = 10", () => {
  it("walks the full three-step RULE, apply-to-both-sides, guided-simplification flow", () => {
    let equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(plainTextEquation(equation)).toBe("2x - 6 = 10");

    // Step 1: coefficient +2 is already positive; no rule needed.

    // Step 2: RULE +6.
    equation = applyRuleToBothSides(equation, { kind: "add", term: constantTerm(fromInt(6)) });
    expect(plainTextEquation(equation)).toBe("2x - 6 + 6 = 10 + 6");
    equation = canonicaliseEquation(equation);
    expect(plainTextEquation(equation)).toBe("2x = 16");

    // Step 3: RULE ÷2.
    equation = applyRuleToBothSides(equation, { kind: "divide", value: fromInt(2) });
    equation = canonicaliseEquation(equation);
    expect(plainTextEquation(equation)).toBe("x = 8");

    expect(solveEquation(equation)).toEqual(fromInt(8));

    const original = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(verifyBySubstitution(original, fromInt(8))).toBe(true);
  });
});

describe("canonical example 2: 24 - 4x = 8", () => {
  it("walks the full three-step RULE, apply-to-both-sides, guided-simplification flow", () => {
    let equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    expect(plainTextEquation(equation)).toBe("24 - 4x = 8");

    // Step 1: coefficient is -4, so RULE +4x.
    equation = applyRuleToBothSides(equation, { kind: "add", term: xTerm(fromInt(4)) });
    expect(plainTextEquation(equation)).toBe("24 - 4x + 4x = 8 + 4x");
    equation = canonicaliseEquation(equation);
    expect(plainTextEquation(equation)).toBe("24 = 8 + 4x");

    // Step 2: RULE -8.
    equation = applyRuleToBothSides(equation, { kind: "subtract", term: constantTerm(fromInt(8)) });
    expect(plainTextEquation(equation)).toBe("24 - 8 = 8 + 4x - 8");
    equation = canonicaliseEquation(equation);
    expect(plainTextEquation(equation)).toBe("16 = 4x");

    // Step 3: RULE ÷4.
    equation = applyRuleToBothSides(equation, { kind: "divide", value: fromInt(4) });
    equation = canonicaliseEquation(equation);
    expect(plainTextEquation(equation)).toBe("4 = x");
    // Side-swap for presentation only; the domain model doesn't need to move terms
    // to prove correctness, so we verify the solver agrees independently.

    expect(solveEquation(equation)).toEqual(fromInt(4));

    const original = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    expect(verifyBySubstitution(original, fromInt(4))).toBe(true);
  });
});
