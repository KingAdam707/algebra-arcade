import type { Equation, EquationSide, Term } from "./equation";
import { abs, isNegative } from "./rational";

export type NumberToken =
  | { kind: "integer"; value: number }
  | { kind: "fraction"; numerator: number; denominator: number };

export type FormattedTerm = {
  /** Sign relative to the previous token. The first term's sign is only rendered when negative. */
  sign: "+" | "-";
  isLeading: boolean;
  variable: boolean;
  /** Absolute magnitude. A variable term with an integer magnitude of 1 renders as bare "x". */
  magnitude: NumberToken;
  /** Plain-text rendering, e.g. "2x", "x", "6", "3/4". Never includes the sign or "+ -". */
  text: string;
  /** Full natural-language reading for screen readers, e.g. "negative six", "two x". */
  spokenText: string;
};

export type FormattedSide = FormattedTerm[];

export type DisplayTokenTree = {
  left: FormattedSide;
  right: FormattedSide;
};

function numberToken(term: Term): NumberToken {
  const magnitude = abs(term.coefficient);
  return magnitude.denominator === 1
    ? { kind: "integer", value: magnitude.numerator }
    : { kind: "fraction", numerator: magnitude.numerator, denominator: magnitude.denominator };
}

function magnitudeText(magnitude: NumberToken, variable: boolean): string {
  if (variable && magnitude.kind === "integer" && magnitude.value === 1) {
    return "x";
  }
  const numberPart =
    magnitude.kind === "integer" ? `${magnitude.value}` : `${magnitude.numerator}/${magnitude.denominator}`;
  return variable ? `${numberPart}x` : numberPart;
}

function spokenNumber(magnitude: NumberToken): string {
  return magnitude.kind === "integer"
    ? `${magnitude.value}`
    : `${magnitude.numerator} over ${magnitude.denominator}`;
}

function formatTerm(term: Term, index: number): FormattedTerm {
  const sign = isNegative(term.coefficient) ? "-" : "+";
  const magnitude = numberToken(term);
  const variable = term.variable === "x";
  const text = magnitudeText(magnitude, variable);
  const spokenMagnitude = variable
    ? magnitude.kind === "integer" && magnitude.value === 1
      ? "x"
      : `${spokenNumber(magnitude)} x`
    : spokenNumber(magnitude);
  const isLeading = index === 0;
  const spokenSign = sign === "-" ? "negative " : isLeading ? "" : "plus ";
  return {
    sign,
    isLeading,
    variable,
    magnitude,
    text,
    spokenText: `${spokenSign}${spokenMagnitude}`,
  };
}

export function formatSide(side: EquationSide): FormattedSide {
  return side.map((term, index) => formatTerm(term, index));
}

export function formatEquation(equation: Equation): DisplayTokenTree {
  return {
    left: formatSide(equation.left),
    right: formatSide(equation.right),
  };
}

/** Natural-language sentence for a whole equation, for aria-live announcements. */
export function spokenEquation(equation: Equation): string {
  const speakSide = (side: FormattedSide) =>
    side
      .map((term, index) => (index === 0 ? term.spokenText : ` ${term.spokenText}`))
      .join("")
      .trim();
  const tree = formatEquation(equation);
  return `${speakSide(tree.left)} equals ${speakSide(tree.right)}`;
}

/** Compact plain-text rendering, e.g. "2x - 6 = 10". Useful for tests and non-visual fallbacks. */
export function plainTextEquation(equation: Equation): string {
  const renderSide = (side: FormattedSide) =>
    side
      .map((term, index) =>
        index === 0 ? `${term.sign === "-" ? "-" : ""}${term.text}` : ` ${term.sign} ${term.text}`,
      )
      .join("");
  const tree = formatEquation(equation);
  return `${renderSide(tree.left)} = ${renderSide(tree.right)}`;
}
