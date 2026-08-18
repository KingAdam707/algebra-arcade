import { type Equation, reduceToStandardForm } from "./equation";
import { type Rational, divide, isZero, negate } from "./rational";

export class NoUniqueSolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoUniqueSolutionError";
  }
}

/** Solves a one-variable linear equation exactly, returning the rational value of x. */
export function solveEquation(equation: Equation): Rational {
  const { coefficient, constant } = reduceToStandardForm(equation);
  if (isZero(coefficient)) {
    throw new NoUniqueSolutionError(
      isZero(constant)
        ? "Equation is an identity: every value of x is a solution."
        : "Equation is a contradiction: no value of x is a solution.",
    );
  }
  // coefficient * x + constant = 0  =>  x = -constant / coefficient
  return divide(negate(constant), coefficient);
}

/** Substitutes a candidate value for x and checks both sides evaluate to the same rational. */
export function verifyBySubstitution(equation: Equation, x: Rational): boolean {
  const evaluateSide = (side: Equation["left"]) =>
    side.reduce((total, term) => {
      const value = term.variable === "x" ? multiplyValue(term.coefficient, x) : term.coefficient;
      return addValue(total, value);
    }, { numerator: 0, denominator: 1 } as Rational);

  const left = evaluateSide(equation.left);
  const right = evaluateSide(equation.right);
  return left.numerator * right.denominator === right.numerator * left.denominator;
}

function multiplyValue(a: Rational, b: Rational): Rational {
  return { numerator: a.numerator * b.numerator, denominator: a.denominator * b.denominator };
}

function addValue(a: Rational, b: Rational): Rational {
  return {
    numerator: a.numerator * b.denominator + b.numerator * a.denominator,
    denominator: a.denominator * b.denominator,
  };
}
