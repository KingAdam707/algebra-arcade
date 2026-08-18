import { type Equation, equationFromCoefficients } from "./equation";
import { type Rational, fromInt, isZero, makeRational } from "./rational";
import { type RandomSource, chance, randomInt, randomSign } from "./random";

export type Difficulty = "easy" | "medium" | "hard";

export type GeneratedQuestion = {
  equation: Equation;
  solution: Rational;
  difficulty: Difficulty;
  /** Sign of the x coefficient in the equation as originally written (before any solving steps). */
  startingCoefficientSign: "positive" | "negative";
  /** Whether the x-term sits on the left of the displayed starting equation. */
  xOnLeft: boolean;
};

type DifficultyConfig = {
  solutionMin: number;
  solutionMax: number;
  /** Denominators the solution may reduce to, when a fractional solution is allowed. Empty = integer only. */
  allowedDenominators: number[];
  fractionSolutionProbability: number;
  constantAbsMax: number;
  /** When set, a nonzero displayed constant must have abs value in [constantAbsMinNonzero, constantAbsMax]. */
  constantAbsMinNonzero: number;
  zeroConstantProbability: number;
  coefficientMagMin: number;
  coefficientMagMax: number;
  negativeCoefficientProbability: number;
};

const CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    solutionMin: 1,
    solutionMax: 4,
    allowedDenominators: [],
    fractionSolutionProbability: 0,
    constantAbsMax: 9,
    constantAbsMinNonzero: 1,
    zeroConstantProbability: 0.1,
    coefficientMagMin: 1,
    coefficientMagMax: 4,
    negativeCoefficientProbability: 0.3,
  },
  medium: {
    solutionMin: 6,
    solutionMax: 9,
    allowedDenominators: [],
    fractionSolutionProbability: 0,
    constantAbsMax: 49,
    constantAbsMinNonzero: 11,
    zeroConstantProbability: 0.1,
    coefficientMagMin: 2,
    coefficientMagMax: 6,
    negativeCoefficientProbability: 0.4,
  },
  hard: {
    solutionMin: 1,
    solutionMax: 15,
    allowedDenominators: [2, 3, 4, 5],
    fractionSolutionProbability: 0.5,
    constantAbsMax: 150,
    constantAbsMinNonzero: 1,
    zeroConstantProbability: 0.1,
    coefficientMagMin: 2,
    coefficientMagMax: 12,
    negativeCoefficientProbability: 0.5,
  },
};

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a === 0 ? 1 : a;
}

function pickSolution(config: DifficultyConfig, rng: RandomSource): Rational {
  const wantsFraction =
    config.allowedDenominators.length > 0 && chance(rng, config.fractionSolutionProbability);
  if (!wantsFraction) {
    return fromInt(randomInt(rng, config.solutionMin, config.solutionMax));
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    const denominator = config.allowedDenominators[randomInt(rng, 0, config.allowedDenominators.length - 1)];
    const numeratorMin = Math.ceil(config.solutionMin * denominator);
    const numeratorMax = Math.floor(config.solutionMax * denominator);
    if (numeratorMax < numeratorMin) continue;
    const numerator = randomInt(rng, numeratorMin, numeratorMax);
    if (gcd(numerator, denominator) !== 1) continue; // must not reduce to a smaller/integer denominator
    return makeRational(numerator, denominator);
  }
  // Fallback: an integer solution is always constructible within range.
  return fromInt(randomInt(rng, config.solutionMin, config.solutionMax));
}

/** Picks a coefficient magnitude within range that is a multiple of `denominator`, when required. */
function pickCoefficientMagnitude(config: DifficultyConfig, denominator: number, rng: RandomSource): number {
  if (denominator === 1) {
    return randomInt(rng, config.coefficientMagMin, config.coefficientMagMax);
  }
  const kMin = Math.max(1, Math.ceil(config.coefficientMagMin / denominator));
  const kMax = Math.floor(config.coefficientMagMax / denominator);
  if (kMax >= kMin) {
    return randomInt(rng, kMin, kMax) * denominator;
  }
  // Range too narrow for the denominator: use the smallest valid multiple.
  return denominator;
}

function pickDisplayedConstant(config: DifficultyConfig, rng: RandomSource): number {
  if (config.constantAbsMinNonzero > 1 && chance(rng, config.zeroConstantProbability)) {
    return 0;
  }
  const magnitude = randomInt(rng, config.constantAbsMinNonzero, config.constantAbsMax);
  return chance(rng, 0.5) ? magnitude : -magnitude;
}

function isWithinDisplayLimits(config: DifficultyConfig, value: number): boolean {
  const magnitude = Math.abs(value);
  if (magnitude > config.constantAbsMax) return false;
  if (magnitude !== 0 && magnitude < config.constantAbsMinNonzero) return false;
  return true;
}

/**
 * Generates one question by working backwards from a chosen solution, per
 * spec section 8. Rejects and retries any candidate that violates its
 * difficulty's display constraints or the generator safeguards.
 */
export function generateQuestion(
  difficulty: Difficulty,
  rng: RandomSource,
  recentSigns: readonly ("positive" | "negative")[] = [],
): GeneratedQuestion {
  const config = CONFIG[difficulty];

  for (let attempt = 0; attempt < 500; attempt++) {
    const solution = pickSolution(config, rng);
    const denominator = solution.denominator;

    let sign = randomSign(rng, config.negativeCoefficientProbability);
    // Avoid more than two identical sign patterns in a row.
    if (recentSigns.length >= 2 && recentSigns[recentSigns.length - 1] === recentSigns[recentSigns.length - 2]) {
      const forced: "positive" | "negative" = recentSigns[recentSigns.length - 1] === "positive" ? "negative" : "positive";
      sign = forced === "positive" ? 1 : -1;
    }

    const magnitude = pickCoefficientMagnitude(config, denominator, rng);
    const a = fromInt(sign * magnitude);
    if (a.numerator === 0) continue; // Reject a = 0.

    const b = fromInt(pickDisplayedConstant(config, rng));

    // c = a*x + b, guaranteed integral because `magnitude` is a multiple of the solution's denominator.
    const axNumerator = (a.numerator * solution.numerator) / denominator;
    if (!Number.isInteger(axNumerator)) continue; // Defensive: should never happen by construction.
    const c = fromInt(axNumerator + b.numerator);

    if (!isWithinDisplayLimits(config, b.numerator)) continue;
    if (!isWithinDisplayLimits(config, c.numerator)) continue;

    // Reject a starting equation already equal to x = n.
    if (a.numerator === 1 && a.denominator === 1 && isZero(b)) continue;

    const xOnLeft = chance(rng, 0.5);
    const equation = xOnLeft
      ? equationFromCoefficients(a, b, c)
      : swapSides(equationFromCoefficients(a, b, c));

    return {
      equation,
      solution,
      difficulty,
      startingCoefficientSign: sign === 1 ? "positive" : "negative",
      xOnLeft,
    };
  }

  throw new Error(`Unable to generate a valid ${difficulty} question after 500 attempts`);
}

function swapSides(equation: Equation): Equation {
  return { left: equation.right, right: equation.left };
}

function signatureOf(question: GeneratedQuestion): string {
  const { left, right } = question.equation;
  const sideKey = (side: Equation["left"]) =>
    side.map((t) => `${t.variable ?? "c"}:${t.coefficient.numerator}/${t.coefficient.denominator}`).join(",");
  return `${sideKey(left)}|${sideKey(right)}`;
}

/** Generates a full session of questions with no duplicates and bounded sign runs. */
export function generateSession(
  difficulty: Difficulty,
  count: number,
  rng: RandomSource,
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const seenSignatures = new Set<string>();
  const recentSigns: ("positive" | "negative")[] = [];

  let guard = 0;
  while (questions.length < count && guard < count * 200 + 1000) {
    guard++;
    const question = generateQuestion(difficulty, rng, recentSigns);
    const signature = signatureOf(question);
    if (seenSignatures.has(signature)) continue; // Reject duplicate questions within a session.
    seenSignatures.add(signature);
    questions.push(question);
    recentSigns.push(question.startingCoefficientSign);
  }

  if (questions.length < count) {
    throw new Error(`Unable to fill a ${count}-question ${difficulty} session without duplicates`);
  }
  return questions;
}
