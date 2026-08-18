import { type Equation, type Rule, type Term, constantTerm, xTerm } from "./equation";
import {
  type Rational,
  ZERO,
  abs,
  add,
  equalsRational,
  isNegative,
  isPositive,
  isZero,
  makeRational,
  toApproximateNumber,
} from "./rational";

export type ActiveStep = 1 | 2 | 3;

/** The rule that actually completes the active step, or null when the step is already satisfied. */
export function idealRuleForStep(equation: Equation, step: ActiveStep): Rule | null {
  const xCoefficient = findXCoefficient(equation);
  if (step === 1) {
    if (xCoefficient === null || !isNegative(xCoefficient)) return null;
    return { kind: "add", term: xTerm(abs(xCoefficient)) };
  }
  if (step === 2) {
    if (xCoefficient === null) return null;
    const constant = constantOnSameSideAsX(equation);
    if (constant === null || isZero(constant)) return null;
    return isPositive(constant)
      ? { kind: "subtract", term: constantTerm(abs(constant)) }
      : { kind: "add", term: constantTerm(abs(constant)) };
  }
  // step 3
  if (xCoefficient === null || isZero(xCoefficient)) return null;
  return { kind: "divide", value: abs(xCoefficient) };
}

function findXCoefficient(equation: Equation): Rational | null {
  for (const term of [...equation.left, ...equation.right]) {
    if (term.variable === "x") {
      return term.coefficient;
    }
  }
  return null;
}

function constantOnSameSideAsX(equation: Equation): Rational | null {
  const side = equation.left.some((t) => t.variable === "x") ? equation.left : equation.right;
  let constant: Rational = ZERO;
  let found = false;
  for (const term of side) {
    if (term.variable !== "x") {
      constant = add(constant, term.coefficient);
      found = true;
    }
  }
  return found ? constant : null;
}

export type RuleFeedbackCategory =
  | "correct"
  | "sign-error"
  | "magnitude-error"
  | "missing-variable"
  | "unhelpful-valid"
  | "premature-division"
  | "invalid";

export type RuleFeedback = {
  category: RuleFeedbackCategory;
  idealRule: Rule | null;
};

export function isAddSubtract(rule: Rule): rule is Extract<Rule, { kind: "add" | "subtract" }> {
  return rule.kind === "add" || rule.kind === "subtract";
}

function ruleMagnitude(rule: Rule): Rational {
  return isAddSubtract(rule) ? abs(rule.term.coefficient) : abs(rule.value);
}

/** Classifies a learner's chosen RULE against the one that actually completes the active step. */
export function classifyRuleAttempt(equation: Equation, step: ActiveStep, rule: Rule): RuleFeedback {
  const ideal = idealRuleForStep(equation, step);

  if ((step === 1 || step === 2) && (rule.kind === "multiply" || rule.kind === "divide")) {
    return { category: "premature-division", idealRule: ideal };
  }
  if (step === 3 && isAddSubtract(rule)) {
    return { category: "invalid", idealRule: ideal };
  }
  if (ideal === null) {
    return { category: "unhelpful-valid", idealRule: null };
  }

  if (step === 1 && isAddSubtract(rule) && rule.term.variable !== "x") {
    return { category: "missing-variable", idealRule: ideal };
  }

  const magnitude = ruleMagnitude(rule);
  const idealMagnitude = ruleMagnitude(ideal);
  const sameMagnitude = equalsRational(magnitude, idealMagnitude);

  if (isAddSubtract(rule) && isAddSubtract(ideal)) {
    const sameKind = rule.kind === ideal.kind;
    const sameVariable = rule.term.variable === ideal.term.variable;
    if (sameMagnitude && sameKind && sameVariable) return { category: "correct", idealRule: ideal };
    if (sameMagnitude && !sameKind && sameVariable) return { category: "sign-error", idealRule: ideal };
    if (!sameMagnitude && sameKind && sameVariable && isNearMiss(magnitude, idealMagnitude)) {
      return { category: "magnitude-error", idealRule: ideal };
    }
    return { category: "unhelpful-valid", idealRule: ideal };
  }

  // step 3: divide
  if (sameMagnitude) return { category: "correct", idealRule: ideal };
  if (isNearMiss(magnitude, idealMagnitude)) return { category: "magnitude-error", idealRule: ideal };
  return { category: "unhelpful-valid", idealRule: ideal };
}

/**
 * True when a wrong magnitude looks like a plausible arithmetic slip rather
 * than an arbitrary, unrelated number. Used to separate "magnitude error"
 * (close attempt at the right target) from "unhelpful but balance-preserving"
 * (a legal move that isn't really aimed at the blocking term).
 */
function isNearMiss(actual: Rational, ideal: Rational): boolean {
  const actualValue = toApproximateNumber(actual);
  const idealValue = toApproximateNumber(ideal);
  if (idealValue === 0) return actualValue === 0;
  return Math.abs(actualValue - idealValue) <= Math.max(2, Math.abs(idealValue));
}

export type SimplificationGroup = {
  terms: Term[];
};

export type SimplificationAnswer = {
  /** Raw numerator/denominator exactly as entered on the number pad, before any reduction. */
  numerator: number;
  denominator: number;
  variable: boolean;
};

export type SimplificationFeedbackCategory =
  | "correct"
  | "arithmetic-error"
  | "fraction-error"
  | "zero-cancellation-error"
  | "missing-variable"
  | "extra-variable";

export type SimplificationFeedback = {
  category: SimplificationFeedbackCategory;
  expected: Term;
};

/** The result of combining every term in a merge group (e.g. "-6" and "+6" combine to "0"). */
export function expectedTermForMergeGroup(group: SimplificationGroup): Term {
  const coefficient = group.terms.reduce((sum, term) => add(sum, term.coefficient), ZERO);
  const isVariableGroup = group.terms.some((term) => term.variable === "x");
  return { coefficient, variable: isVariableGroup ? "x" : null };
}

/** True when a merge group is specifically two opposite terms cancelling to zero (not just "sums to zero" by coincidence of >2 terms). */
export function isCancellationGroup(group: SimplificationGroup): boolean {
  return group.terms.length > 1 && isZero(expectedTermForMergeGroup(group).coefficient);
}

/**
 * Classifies a learner's answer for one local simplification target against
 * the term it should resolve to. Used both for merging two terms (e.g.
 * "-6 + 6" -> "0", expected via `expectedTermForMergeGroup`) and for
 * evaluating a single scaled term (e.g. "2x ÷ 2" -> "x", expected computed
 * directly by the caller from the applied RULE).
 */
export function classifySimplificationAttempt(
  expected: Term,
  answer: SimplificationAnswer,
  options: { isCancellation?: boolean } = {},
): SimplificationFeedback {
  const expectedIsVariable = expected.variable === "x";

  if (answer.variable && !expectedIsVariable) {
    return { category: "extra-variable", expected };
  }
  if (!answer.variable && expectedIsVariable && !isZero(expected.coefficient)) {
    return { category: "missing-variable", expected };
  }

  if (answer.denominator === 0) {
    return { category: "arithmetic-error", expected };
  }
  const answerValue = makeRational(answer.numerator, answer.denominator);

  if (equalsRational(answerValue, expected.coefficient)) {
    // The value is right, but did the learner type it in reduced form?
    const enteredReduced = answer.numerator === expected.coefficient.numerator && answer.denominator === expected.coefficient.denominator;
    if (!enteredReduced && (answer.denominator !== 1 || expected.coefficient.denominator !== 1)) {
      return { category: "fraction-error", expected };
    }
    return { category: "correct", expected };
  }

  if (options.isCancellation) {
    return { category: "zero-cancellation-error", expected };
  }

  const isFraction = expected.coefficient.denominator !== 1 || answer.denominator !== 1;
  if (isFraction && expected.coefficient.numerator !== 0) {
    const numeratorDenominatorSwapped =
      answer.numerator === expected.coefficient.denominator && answer.denominator === expected.coefficient.numerator;
    if (numeratorDenominatorSwapped) {
      return { category: "fraction-error", expected };
    }
  }

  return { category: "arithmetic-error", expected };
}
