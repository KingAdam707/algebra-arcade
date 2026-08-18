import {
  type Rational,
  ZERO,
  add,
  equalsRational,
  fromInt,
  isZero,
  makeRational,
  multiply,
  negate,
  subtract,
} from "./rational";

export type Term = {
  coefficient: Rational;
  variable: "x" | null;
};

export type EquationSide = Term[];

export type Equation = {
  left: EquationSide;
  right: EquationSide;
};

export type Rule =
  | { kind: "add" | "subtract"; term: Term }
  | { kind: "multiply" | "divide"; value: Rational };

export function xTerm(coefficient: Rational): Term {
  return { coefficient, variable: "x" };
}

export function constantTerm(coefficient: Rational): Term {
  return { coefficient, variable: null };
}

function isScaleRule(rule: Rule): rule is Extract<Rule, { kind: "multiply" | "divide" }> {
  return rule.kind === "multiply" || rule.kind === "divide";
}

/** Applies a rule identically to both sides, producing the expanded (not yet simplified) equation. */
export function applyRuleToBothSides(equation: Equation, rule: Rule): Equation {
  if (isScaleRule(rule)) {
    const factor = rule.kind === "multiply" ? rule.value : invert(rule.value);
    return {
      left: equation.left.map((t) => scaleTerm(t, factor)),
      right: equation.right.map((t) => scaleTerm(t, factor)),
    };
  }

  const term: Term =
    rule.kind === "add" ? rule.term : { coefficient: negate(rule.term.coefficient), variable: rule.term.variable };
  return {
    left: [...equation.left, term],
    right: [...equation.right, term],
  };
}

function invert(value: Rational): Rational {
  return makeRational(value.denominator, value.numerator);
}

function scaleTerm(term: Term, factor: Rational): Term {
  return { coefficient: multiply(term.coefficient, factor), variable: term.variable };
}

/**
 * Combines like terms on one side into at most one x-term and one constant
 * term. A term that cancels to zero is dropped from this fully-reduced form
 * (the transient "briefly visible zero" during guided simplification is a
 * UI concern, not part of the canonical equation). When no merging actually
 * happens, the original left-to-right order of the two kinds is preserved
 * (e.g. "8 + 4x" is never reordered to "4x + 8").
 */
export function simplifySide(side: EquationSide): EquationSide {
  let xCoefficient: Rational = ZERO;
  let constant: Rational = ZERO;
  let xFirstIndex = -1;
  let constantFirstIndex = -1;
  side.forEach((term, index) => {
    if (term.variable === "x") {
      xCoefficient = add(xCoefficient, term.coefficient);
      if (xFirstIndex === -1) xFirstIndex = index;
    } else {
      constant = add(constant, term.coefficient);
      if (constantFirstIndex === -1) constantFirstIndex = index;
    }
  });

  const parts: { order: number; term: Term }[] = [];
  if (!isZero(xCoefficient)) {
    parts.push({ order: xFirstIndex, term: xTerm(xCoefficient) });
  }
  const sideHasNoOtherTerm = parts.length === 0;
  if (!isZero(constant) || sideHasNoOtherTerm) {
    parts.push({
      order: constantFirstIndex === -1 ? Number.MAX_SAFE_INTEGER : constantFirstIndex,
      term: constantTerm(constant),
    });
  }
  parts.sort((a, b) => a.order - b.order);
  return parts.map((p) => p.term);
}

/** Fully simplifies both sides. This is the canonical, minimal-term form of the equation. */
export function canonicaliseEquation(equation: Equation): Equation {
  return {
    left: simplifySide(equation.left),
    right: simplifySide(equation.right),
  };
}

function sideCoefficients(side: EquationSide): { x: Rational; constant: Rational } {
  const simplified = simplifySide(side);
  let x: Rational = ZERO;
  let constant: Rational = ZERO;
  for (const term of simplified) {
    if (term.variable === "x") x = term.coefficient;
    else constant = term.coefficient;
  }
  return { x, constant };
}

/** The x-coefficient and constant of `left - right`, i.e. the equation reduced to `coeff*x + constant = 0`. */
export function reduceToStandardForm(equation: Equation): { coefficient: Rational; constant: Rational } {
  const left = sideCoefficients(equation.left);
  const right = sideCoefficients(equation.right);
  return {
    coefficient: subtract(left.x, right.x),
    constant: subtract(left.constant, right.constant),
  };
}

/**
 * Algebraic equivalence: true when `before` and `after` have the same
 * solution set. Adding/subtracting the same term to both sides leaves the
 * standard form identical; multiplying/dividing both sides by a nonzero
 * factor scales it, so equivalence is proportionality, not exact equality.
 * This never compares formatted strings.
 */
export function isEquivalent(before: Equation, after: Equation): boolean {
  const b = reduceToStandardForm(before);
  const a = reduceToStandardForm(after);
  const bCoefficientZero = isZero(b.coefficient);
  const aCoefficientZero = isZero(a.coefficient);
  if (bCoefficientZero !== aCoefficientZero) return false;
  if (bCoefficientZero) {
    // Both are "constant = 0" statements: equivalent iff both identities or both contradictions.
    return isZero(b.constant) === isZero(a.constant);
  }
  return equalsRational(multiply(b.coefficient, a.constant), multiply(a.coefficient, b.constant));
}

export function equationFromCoefficients(a: Rational, b: Rational, c: Rational): Equation {
  return {
    left: isZero(a) ? [constantTerm(b)] : [xTerm(a), constantTerm(b)],
    right: [constantTerm(c)],
  };
}

export { fromInt };
