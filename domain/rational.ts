/**
 * Exact rational-number arithmetic. This is the mathematical source of truth
 * for the whole product: no floating-point numbers are ever used to
 * represent a coefficient, constant, or solution.
 */

export type Rational = {
  numerator: number;
  denominator: number; // Always positive and coprime with numerator.
};

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a === 0 ? 1 : a;
}

/** Builds a reduced rational with a positive denominator. */
export function makeRational(numerator: number, denominator: number): Rational {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error("Rational components must be integers");
  }
  if (denominator === 0) {
    throw new Error("Rational denominator cannot be zero");
  }
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

export function fromInt(value: number): Rational {
  return makeRational(value, 1);
}

export const ZERO: Rational = { numerator: 0, denominator: 1 };
export const ONE: Rational = { numerator: 1, denominator: 1 };

export function add(a: Rational, b: Rational): Rational {
  return makeRational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function subtract(a: Rational, b: Rational): Rational {
  return makeRational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function multiply(a: Rational, b: Rational): Rational {
  return makeRational(a.numerator * b.numerator, a.denominator * b.denominator);
}

export function divide(a: Rational, b: Rational): Rational {
  if (b.numerator === 0) {
    throw new Error("Cannot divide by zero");
  }
  return makeRational(a.numerator * b.denominator, a.denominator * b.numerator);
}

export function negate(a: Rational): Rational {
  return { numerator: -a.numerator, denominator: a.denominator };
}

export function abs(a: Rational): Rational {
  return { numerator: Math.abs(a.numerator), denominator: a.denominator };
}

export function isZero(a: Rational): boolean {
  return a.numerator === 0;
}

export function isPositive(a: Rational): boolean {
  return a.numerator > 0;
}

export function isNegative(a: Rational): boolean {
  return a.numerator < 0;
}

export function isInteger(a: Rational): boolean {
  return a.denominator === 1;
}

export function equalsRational(a: Rational, b: Rational): boolean {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

/** -1, 0, or 1 depending on whether a is less than, equal to, or greater than b. */
export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const diff = a.numerator * b.denominator - b.numerator * a.denominator;
  if (diff === 0) return 0;
  return diff > 0 ? 1 : -1;
}

/**
 * Only for internal heuristics (e.g. difficulty bucketing of a magnitude).
 * Never treat this as the value's canonical representation.
 */
export function toApproximateNumber(a: Rational): number {
  return a.numerator / a.denominator;
}

/** Human-readable fraction text, e.g. "3/4", "-2", "0". */
export function toDisplayString(a: Rational): string {
  if (a.denominator === 1) {
    return `${a.numerator}`;
  }
  return `${a.numerator}/${a.denominator}`;
}
