import { describe, expect, it } from "vitest";
import { type Difficulty, generateQuestion, generateSession } from "@/domain/generator";
import { createSeededRandom } from "@/domain/random";
import { solveEquation, verifyBySubstitution } from "@/domain/solver";
import { fromInt, toApproximateNumber } from "@/domain/rational";

const SAMPLE_SIZE = 10_000;

function sideConstant(side: { variable: "x" | null; coefficient: { numerator: number; denominator: number } }[]) {
  const constants = side.filter((t) => t.variable === null);
  return constants.length === 0 ? 0 : constants[0].coefficient.numerator;
}

function sideCoefficient(side: { variable: "x" | null; coefficient: { numerator: number; denominator: number } }[]) {
  const xTerms = side.filter((t) => t.variable === "x");
  return xTerms.length === 0 ? null : xTerms[0].coefficient;
}

describe.each<Difficulty>(["easy", "medium", "hard"])("generateQuestion(%s)", (difficulty) => {
  it(`produces ${SAMPLE_SIZE} valid, self-consistent questions`, () => {
    const rng = createSeededRandom(42);
    let negativeCount = 0;
    let fractionSolutionCount = 0;

    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const question = generateQuestion(difficulty, rng);
      expect(question.difficulty).toBe(difficulty);

      // Exactly one x-term across the whole starting equation.
      const xTermCount = [...question.equation.left, ...question.equation.right].filter(
        (t) => t.variable === "x",
      ).length;
      expect(xTermCount).toBe(1);

      // The generated solution must actually satisfy the equation.
      expect(verifyBySubstitution(question.equation, question.solution)).toBe(true);
      expect(solveEquation(question.equation)).toEqual(question.solution);

      // Coefficient is never zero.
      const xCoefficient = sideCoefficient(question.equation.left) ?? sideCoefficient(question.equation.right);
      expect(xCoefficient).not.toBeNull();
      expect(xCoefficient!.numerator).not.toBe(0);

      // Never already in solved x = n form.
      const isAlreadySolved =
        (question.equation.left.length === 1 &&
          question.equation.left[0].variable === "x" &&
          question.equation.left[0].coefficient.numerator === 1 &&
          question.equation.left[0].coefficient.denominator === 1) ||
        (question.equation.right.length === 1 &&
          question.equation.right[0].variable === "x" &&
          question.equation.right[0].coefficient.numerator === 1 &&
          question.equation.right[0].coefficient.denominator === 1);
      expect(isAlreadySolved).toBe(false);

      if (question.startingCoefficientSign === "negative") negativeCount++;
      if (question.solution.denominator !== 1) fractionSolutionCount++;

      assertDifficultyConstraints(difficulty, question);
    }

    const negativeRate = negativeCount / SAMPLE_SIZE;
    const expectedRate = { easy: 0.3, medium: 0.4, hard: 0.5 }[difficulty];
    expect(negativeRate).toBeGreaterThan(expectedRate - 0.07);
    expect(negativeRate).toBeLessThan(expectedRate + 0.07);

    if (difficulty === "hard") {
      expect(fractionSolutionCount).toBeGreaterThan(0);
    } else {
      expect(fractionSolutionCount).toBe(0);
    }
  });
});

function assertDifficultyConstraints(
  difficulty: Difficulty,
  question: ReturnType<typeof generateQuestion>,
) {
  const solutionValue = toApproximateNumber(question.solution);

  if (difficulty === "easy") {
    expect(solutionValue).toBeGreaterThanOrEqual(1);
    expect(solutionValue).toBeLessThanOrEqual(4);
    expect(Number.isInteger(solutionValue)).toBe(true);
  } else if (difficulty === "medium") {
    expect(solutionValue).toBeGreaterThanOrEqual(6);
    expect(solutionValue).toBeLessThanOrEqual(9);
    expect(Number.isInteger(solutionValue)).toBe(true);
  } else {
    expect(solutionValue).toBeGreaterThanOrEqual(1);
    expect(solutionValue).toBeLessThanOrEqual(15);
    if (question.solution.denominator !== 1) {
      expect([2, 3, 4, 5]).toContain(question.solution.denominator);
    }
  }

  const constantLimits = { easy: 9, medium: 49, hard: 150 }[difficulty];
  const constantMinNonzero = { easy: 1, medium: 11, hard: 1 }[difficulty];

  for (const side of [question.equation.left, question.equation.right]) {
    const constant = sideConstant(side);
    expect(Math.abs(constant)).toBeLessThanOrEqual(constantLimits);
    if (constant !== 0) {
      expect(Math.abs(constant)).toBeGreaterThanOrEqual(constantMinNonzero);
    }
  }

  const xCoefficient = sideCoefficient(question.equation.left) ?? sideCoefficient(question.equation.right);
  const coefficientMagnitude = Math.abs(xCoefficient!.numerator);
  const coefficientLimits = { easy: [1, 4], medium: [2, 6], hard: [2, 12] }[difficulty];
  expect(coefficientMagnitude).toBeGreaterThanOrEqual(coefficientLimits[0]);
  expect(coefficientMagnitude).toBeLessThanOrEqual(coefficientLimits[1]);
}

describe("generateSession", () => {
  it("produces the requested count with no duplicate questions", () => {
    const rng = createSeededRandom(7);
    const session = generateSession("easy", 10, rng);
    expect(session).toHaveLength(10);
    const signatures = session.map((q) => JSON.stringify(q.equation));
    expect(new Set(signatures).size).toBe(10);
  });

  it("never runs more than two identical sign patterns in a row", () => {
    const rng = createSeededRandom(99);
    const session = generateSession("medium", 30, rng);
    let run = 1;
    for (let i = 1; i < session.length; i++) {
      if (session[i].startingCoefficientSign === session[i - 1].startingCoefficientSign) {
        run++;
      } else {
        run = 1;
      }
      expect(run).toBeLessThanOrEqual(2);
    }
  });

  it("includes both left-side and right-side x placement over a medium session", () => {
    const rng = createSeededRandom(13);
    const session = generateSession("medium", 30, rng);
    expect(session.some((q) => q.xOnLeft)).toBe(true);
    expect(session.some((q) => !q.xOnLeft)).toBe(true);
  });
});

describe("canonical seed reproducibility", () => {
  it("produces the same session for the same seed", () => {
    const a = generateSession("easy", 10, createSeededRandom(2024));
    const b = generateSession("easy", 10, createSeededRandom(2024));
    expect(a).toEqual(b);
  });
});

// Sanity: fromInt is re-exported and usable from the same import surface as generator types.
describe("fromInt sanity", () => {
  it("builds an integer rational", () => {
    expect(fromInt(4)).toEqual({ numerator: 4, denominator: 1 });
  });
});
