import { ruleText } from "./feedback";
import { STEP_INFO } from "./method";
import { applyRuleToBothSides, canonicaliseEquation, constantTerm, fromInt, xTerm, type Equation } from "@/domain/equation";
import { idealRuleForStep, type ActiveStep } from "@/domain/evaluator";

/** The fixed equation walked through on the home screen's worked example. Also used by e2e tests. */
export const WORKED_EXAMPLE_EQUATION: Equation = { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] };

export type WorkedExampleFrame = {
  id: string;
  kind: "start" | "rule" | "result" | "solved";
  equation: Equation;
  badge: string;
  explanation: string;
};

function ruleExplanation(step: ActiveStep): string {
  if (step === 1) {
    return `${STEP_INFO[1].title}: the x-term is negative, so add the matching positive x-term to both sides.`;
  }
  if (step === 2) {
    return `${STEP_INFO[2].title}: undo the constant next to x with its inverse operation, applied to both sides.`;
  }
  return `${STEP_INFO[3].title}: x is multiplied by a number, so divide both sides by it.`;
}

/**
 * Derives a passive, narrated walkthrough from the real solver logic (the same
 * `idealRuleForStep` / `applyRuleToBothSides` the practice engine uses) rather than
 * hand-authoring each equation, so the demo can never drift out of sync with how
 * the app actually solves equations.
 */
export function buildWorkedExample(start: Equation): WorkedExampleFrame[] {
  const frames: WorkedExampleFrame[] = [
    {
      id: "start",
      kind: "start",
      equation: start,
      badge: "Start",
      explanation: "Here's an equation with x on one side. Watch the same three moves you'll use in every practice question solve it, start to finish.",
    },
  ];

  let equation = start;
  for (let step = 1; step <= 3; step++) {
    const ideal = idealRuleForStep(equation, step as ActiveStep);
    if (!ideal) continue; // Step already satisfied for this equation: nothing to narrate.

    frames.push({
      id: `${step}-rule`,
      kind: "rule",
      equation,
      badge: `RULE: ${ruleText(ideal)}`,
      explanation: ruleExplanation(step as ActiveStep),
    });

    equation = canonicaliseEquation(applyRuleToBothSides(equation, ideal));
    frames.push({
      id: `${step}-result`,
      kind: "result",
      equation,
      badge: "Simplified",
      explanation: "Combine like terms on each side to simplify.",
    });
  }

  const last = frames[frames.length - 1];
  frames[frames.length - 1] = {
    ...last,
    kind: "solved",
    badge: "Solved!",
    explanation: "That's the method — choose a RULE, apply it to both sides, then simplify. Every equation in practice mode works exactly the same way.",
  };

  return frames;
}

export const WORKED_EXAMPLE_FRAMES: WorkedExampleFrame[] = buildWorkedExample(WORKED_EXAMPLE_EQUATION);
