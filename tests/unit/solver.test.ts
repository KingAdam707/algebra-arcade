import { describe, expect, it } from "vitest";
import { constantTerm, xTerm } from "@/domain/equation";
import { fromInt, makeRational } from "@/domain/rational";
import { NoUniqueSolutionError, solveEquation, verifyBySubstitution } from "@/domain/solver";

describe("solveEquation", () => {
  it("solves 2x - 6 = 10", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(solveEquation(equation)).toEqual(fromInt(8));
    expect(verifyBySubstitution(equation, fromInt(8))).toBe(true);
  });

  it("solves 24 - 4x = 8", () => {
    const equation = { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] };
    expect(solveEquation(equation)).toEqual(fromInt(4));
    expect(verifyBySubstitution(equation, fromInt(4))).toBe(true);
  });

  it("solves to an exact fraction", () => {
    // 2x = 7  =>  x = 7/2
    const equation = { left: [xTerm(fromInt(2))], right: [constantTerm(fromInt(7))] };
    expect(solveEquation(equation)).toEqual(makeRational(7, 2));
  });

  it("throws for an identity", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(4))], right: [xTerm(fromInt(2)), constantTerm(fromInt(4))] };
    expect(() => solveEquation(equation)).toThrow(NoUniqueSolutionError);
  });

  it("throws for a contradiction", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(4))], right: [xTerm(fromInt(2)), constantTerm(fromInt(5))] };
    expect(() => solveEquation(equation)).toThrow(NoUniqueSolutionError);
  });

  it("rejects a wrong substitution", () => {
    const equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };
    expect(verifyBySubstitution(equation, fromInt(7))).toBe(false);
  });
});
