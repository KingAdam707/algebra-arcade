import type { Rule } from "@/domain/equation";
import { isAddSubtract, type RuleFeedbackCategory, type SimplificationFeedbackCategory } from "@/domain/evaluator";
import { toDisplayString } from "@/domain/rational";

export function ruleText(rule: Rule): string {
  if (!isAddSubtract(rule)) {
    return `${rule.kind === "divide" ? "÷" : "×"} ${toDisplayString(rule.value)}`;
  }
  const sign = rule.kind === "add" ? "+" : "−";
  const varSuffix = rule.term.variable === "x" ? "x" : "";
  return `${sign} ${toDisplayString(rule.term.coefficient)}${varSuffix}`;
}

/** Brief, specific, forward-looking feedback for a RULE attempt. Never a generic "Wrong". */
export function ruleFeedbackMessage(category: RuleFeedbackCategory, idealRule: Rule | null): string {
  switch (category) {
    case "correct":
      return "That's the RULE. Watch it apply to both sides.";
    case "sign-error":
      return idealRule
        ? `That changes the equation, but the wrong way. The inverse you need is ${ruleText(idealRule)}.`
        : "That changes the equation, but not in the direction you need.";
    case "magnitude-error":
      return idealRule
        ? `The operation is right, but check the number — you need ${ruleText(idealRule)}.`
        : "The operation looks right, but check the number.";
    case "missing-variable":
      return "That changes the constant, but the x-term is still unbalanced — don't forget the x.";
    case "unhelpful-valid":
      return "That keeps both sides balanced, but it doesn't complete this step. Look at what's blocking x.";
    case "premature-division":
      return "Hold off on dividing — isolate the x-term first, then divide.";
    case "invalid":
      return "That operation isn't available for this step.";
  }
}

export const SIMPLIFICATION_FEEDBACK: Record<SimplificationFeedbackCategory, string> = {
  correct: "Correct.",
  "arithmetic-error": "Not quite — check the arithmetic and try again.",
  "fraction-error": "The value's right, but check the fraction: is it reduced, and the right way up?",
  "zero-cancellation-error": "These are opposite terms. What do they combine to?",
  "missing-variable": "This group still has an x-term — don't forget the x.",
  "extra-variable": "This group is just numbers now — no x needed here.",
};
