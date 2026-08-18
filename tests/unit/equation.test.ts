import { describe, expect, it } from "vitest";
import {
  applyRuleToBothSides,
  canonicaliseEquation,
  constantTerm,
  isEquivalent,
  reduceToStandardForm,
  simplifySide,
  xTerm,
} from "@/domain/equation";
import { fromInt, makeRational } from "@/domain/rational";

describe("applyRuleToBothSides", () => {
  it("adds a constant to both sides", () => {
    // 2x - 6 = 10, RULE: +6
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    const result = applyRuleToBothSides(equation, { kind: "add", term: constantTerm(fromInt(6)) });
    expect(result.left).toEqual([xTerm(fromInt(2)), constantTerm(fromInt(-6)), constantTerm(fromInt(6))]);
    expect(result.right).toEqual([constantTerm(fromInt(10)), constantTerm(fromInt(6))]);
  });

  it("adds an x-term to both sides", () => {
    // 24 - 4x = 8, RULE: +4x
    const equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    const result = applyRuleToBothSides(equation, { kind: "add", term: xTerm(fromInt(4)) });
    expect(result.left).toEqual([constantTerm(fromInt(24)), xTerm(fromInt(-4)), xTerm(fromInt(4))]);
    expect(result.right).toEqual([constantTerm(fromInt(8)), xTerm(fromInt(4))]);
  });

  it("subtracts a constant from both sides", () => {
    const equation = { left: [constantTerm(fromInt(24))], right: [constantTerm(fromInt(8)), xTerm(fromInt(4))] };
    const result = applyRuleToBothSides(equation, { kind: "subtract", term: constantTerm(fromInt(8)) });
    expect(result.left).toEqual([constantTerm(fromInt(24)), constantTerm(fromInt(-8))]);
    expect(result.right).toEqual([constantTerm(fromInt(8)), xTerm(fromInt(4)), constantTerm(fromInt(-8))]);
  });

  it("divides both sides by a positive number", () => {
    const equation = { left: [xTerm(fromInt(2))], right: [constantTerm(fromInt(16))] };
    const result = applyRuleToBothSides(equation, { kind: "divide", value: fromInt(2) });
    expect(result.left).toEqual([xTerm(fromInt(1))]);
    expect(result.right).toEqual([constantTerm(fromInt(8))]);
  });

  it("divides producing a reduced fraction", () => {
    const equation = { left: [xTerm(fromInt(4))], right: [constantTerm(fromInt(6))] };
    const result = applyRuleToBothSides(equation, { kind: "divide", value: fromInt(4) });
    expect(result.right).toEqual([constantTerm(makeRational(3, 2))]);
  });
});

describe("simplifySide / canonicaliseEquation", () => {
  it("combines like terms and drops a cancelled-to-zero constant", () => {
    const side = [xTerm(fromInt(2)), constantTerm(fromInt(-6)), constantTerm(fromInt(6))];
    expect(simplifySide(side)).toEqual([xTerm(fromInt(2))]);
  });

  it("preserves existing order when no merging is needed", () => {
    const side = [constantTerm(fromInt(8)), xTerm(fromInt(4))];
    expect(simplifySide(side)).toEqual([constantTerm(fromInt(8)), xTerm(fromInt(4))]);
  });

  it("cancels opposite x-terms to zero", () => {
    const side = [constantTerm(fromInt(24)), xTerm(fromInt(-4)), xTerm(fromInt(4))];
    expect(simplifySide(side)).toEqual([constantTerm(fromInt(24))]);
  });

  it("keeps a single zero constant when a side is entirely empty of value", () => {
    const side = [constantTerm(fromInt(6)), constantTerm(fromInt(-6))];
    expect(simplifySide(side)).toEqual([constantTerm(fromInt(0))]);
  });
});

describe("isEquivalent", () => {
  it("treats add/subtract of the same term to both sides as equivalent", () => {
    const before = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    const after = applyRuleToBothSides(before, { kind: "add", term: constantTerm(fromInt(6)) });
    expect(isEquivalent(before, after)).toBe(true);
  });

  it("treats divide-both-sides as equivalent even though coefficients scale", () => {
    const before = { left: [xTerm(fromInt(2))], right: [constantTerm(fromInt(16))] };
    const after = applyRuleToBothSides(before, { kind: "divide", value: fromInt(2) });
    expect(isEquivalent(before, after)).toBe(true);
  });

  it("rejects a rule that changes the solution", () => {
    const before = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    const wrong = applyRuleToBothSides(before, { kind: "add", term: constantTerm(fromInt(4)) });
    // Adding +4 to both sides is still balance-preserving and thus equivalent;
    // instead check a genuinely unbalanced hand-built mutation is rejected.
    const unbalanced = { left: [...before.left, constantTerm(fromInt(6))], right: before.right };
    expect(isEquivalent(before, wrong)).toBe(true);
    expect(isEquivalent(before, unbalanced)).toBe(false);
  });

  it("recognises identity vs contradiction as not equivalent to a normal equation", () => {
    const normal = { left: [xTerm(fromInt(1))], right: [constantTerm(fromInt(4))] };
    const identity = { left: [constantTerm(fromInt(0))], right: [constantTerm(fromInt(0))] };
    const contradiction = { left: [constantTerm(fromInt(0))], right: [constantTerm(fromInt(5))] };
    expect(isEquivalent(normal, identity)).toBe(false);
    expect(isEquivalent(normal, contradiction)).toBe(false);
    expect(isEquivalent(identity, contradiction)).toBe(false);
  });
});

describe("canonicaliseEquation", () => {
  it("fully reduces both sides", () => {
    const equation = {
      left: [xTerm(fromInt(2)), constantTerm(fromInt(-6)), constantTerm(fromInt(6))],
      right: [constantTerm(fromInt(10)), constantTerm(fromInt(6))],
    };
    expect(canonicaliseEquation(equation)).toEqual({
      left: [xTerm(fromInt(2))],
      right: [constantTerm(fromInt(16))],
    });
  });
});

describe("reduceToStandardForm", () => {
  it("reduces left - right to coefficient*x + constant", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(reduceToStandardForm(equation)).toEqual({ coefficient: fromInt(2), constant: fromInt(-16) });
  });
});
