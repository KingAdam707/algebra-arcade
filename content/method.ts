import type { Rule } from "@/domain/equation";
import { isAddSubtract } from "@/domain/evaluator";
import { toDisplayString } from "@/domain/rational";
import { ruleText } from "./feedback";

export type StepNumber = 1 | 2 | 3;

export const STEP_INFO: Record<StepNumber, { title: string; short: string; goal: string }> = {
  1: {
    title: "Make the x-term positive",
    short: "Positive x",
    goal: "Check the coefficient of x. If it's negative, add the matching positive x-term to both sides.",
  },
  2: {
    title: "Get the x-term on its own",
    short: "Isolate x",
    goal: "Remove the constant on the x side using its inverse operation.",
  },
  3: {
    title: "Divide by the coefficient",
    short: "Divide",
    goal: "Divide both sides by the positive number multiplying x.",
  },
};

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "coefficient", definition: "the number multiplying x" },
  { term: "constant", definition: "a number without x" },
  { term: "term", definition: "one part of an expression separated by + or −" },
  { term: "LHS", definition: "left-hand side" },
  { term: "RHS", definition: "right-hand side" },
  { term: "inverse operation", definition: "an operation that undoes another operation" },
  { term: "equivalent equations", definition: "equations with the same solution" },
];

/** The four-level progressive hint ladder: Prompt, Notice, Strategy, Model. */
export function hintText(level: 1 | 2 | 3 | 4, step: StepNumber, idealRule: Rule | null): string {
  const info = STEP_INFO[step];
  if (level === 1) return `Prompt: ${info.goal}`;
  if (!idealRule) return `Prompt: ${info.goal}`;

  if (level === 2) {
    return `Notice: ${noticeText(step, idealRule)}`;
  }
  if (level === 3) {
    return `Strategy: the inverse operation is ${strategyText(idealRule)}.`;
  }
  return `Model: try RULE ${ruleText(idealRule)}. Apply it to both sides, then simplify.`;
}

function noticeText(step: StepNumber, idealRule: Rule): string {
  if (step === 1 && idealRule.kind === "add") {
    return `the coefficient of x is negative — that's what's blocking it.`;
  }
  if (step === 2 && (idealRule.kind === "add" || idealRule.kind === "subtract")) {
    const amount = toDisplayString(idealRule.term.coefficient);
    return `look at the constant ${idealRule.kind === "subtract" ? amount : `−${amount}`} on the x side.`;
  }
  if (idealRule.kind === "divide") {
    return `x is still being multiplied by ${toDisplayString(idealRule.value)}.`;
  }
  return STEP_INFO[step].goal;
}

function strategyText(idealRule: Rule): string {
  if (!isAddSubtract(idealRule)) return `dividing by ${toDisplayString(idealRule.value)}`;
  const amount = toDisplayString(idealRule.term.coefficient);
  const suffix = idealRule.term.variable === "x" ? "x" : "";
  return idealRule.kind === "add" ? `adding ${amount}${suffix}` : `subtracting ${amount}${suffix}`;
}
