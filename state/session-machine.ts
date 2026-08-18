import {
  type Difficulty,
  type GeneratedQuestion,
  generateSession,
} from "@/domain/generator";
import {
  type Equation,
  type EquationSide,
  type Rule,
  type Term,
  applyRuleToBothSides,
  canonicaliseEquation,
  simplifySide,
} from "@/domain/equation";
import {
  type ActiveStep,
  type RuleFeedbackCategory,
  type SimplificationAnswer,
  type SimplificationFeedbackCategory,
  classifyRuleAttempt,
  classifySimplificationAttempt,
  expectedTermForMergeGroup,
  idealRuleForStep,
  isAddSubtract,
  isCancellationGroup,
} from "@/domain/evaluator";
import type { RandomSource } from "@/domain/random";
import { equalsRational, isZero, negate } from "@/domain/rational";

export type StepNumber = ActiveStep;

export type SkillId =
  | "make-x-positive"
  | "choose-inverse"
  | "apply-both-sides"
  | "simplify-numbers"
  | "divide-coefficient"
  | "fractions";

export const SKILL_LABELS: Record<SkillId, string> = {
  "make-x-positive": "Making the x-term positive",
  "choose-inverse": "Choosing inverse operations",
  "apply-both-sides": "Applying the same rule to both sides",
  "simplify-numbers": "Simplifying number terms",
  "divide-coefficient": "Dividing by the coefficient",
  fractions: "Working with fractions",
};

type SkillTally = { attempts: number; correctFirstTry: number };

export type QuestionOutcome = "independent" | "hint" | "guidance";

export type QuestionRecord = {
  question: GeneratedQuestion;
  hintsUsed: number;
  outcome: QuestionOutcome;
};

/** One local simplification target within the active step's expanded equation. */
export type SimplificationTarget = {
  id: string;
  side: "left" | "right";
  kind: "merge" | "scale";
  /** Terms to display before this target is resolved (2 for a merge, 1 for a scale). */
  beforeTerms: Term[];
  /** The scale operation to annotate next to beforeTerms[0], only set for kind "scale". */
  operation?: { kind: "multiply" | "divide"; value: Term["coefficient"] };
  expected: Term;
  isCancellation: boolean;
};

export type HintLevel = 0 | 1 | 2 | 3 | 4;

export type PracticePhase =
  | { name: "question_intro" }
  | { name: "enter_rule"; hintLevel: HintLevel; lastFeedbackCategory: RuleFeedbackCategory | null }
  | { name: "rule_feedback"; category: RuleFeedbackCategory; rule: Rule }
  | {
      name: "choose_simplification";
      rule: Rule;
      preRuleEquation: Equation;
      targets: SimplificationTarget[];
      resolvedIds: string[];
      selectedTargetId: string | null;
      lastFeedbackCategory: SimplificationFeedbackCategory | null;
    }
  | { name: "step_complete" }
  | { name: "question_complete" }
  | { name: "session_complete" };

export type SessionState = {
  difficulty: Difficulty;
  questions: GeneratedQuestion[];
  currentQuestionIndex: number;
  currentStep: StepNumber;
  /** The canonical working equation for the active question/step. */
  equation: Equation;
  /** Prior canonical equations for the active question, oldest first, for the transformation history display. */
  stepHistory: Equation[];
  phase: PracticePhase;
  combo: number;
  records: QuestionRecord[];
  hintsUsedThisQuestion: number;
  skillTallies: Record<SkillId, SkillTally>;
};

function emptySkillTallies(): Record<SkillId, SkillTally> {
  return {
    "make-x-positive": { attempts: 0, correctFirstTry: 0 },
    "choose-inverse": { attempts: 0, correctFirstTry: 0 },
    "apply-both-sides": { attempts: 0, correctFirstTry: 0 },
    "simplify-numbers": { attempts: 0, correctFirstTry: 0 },
    "divide-coefficient": { attempts: 0, correctFirstTry: 0 },
    fractions: { attempts: 0, correctFirstTry: 0 },
  };
}

/** Builds a fresh session directly from a question list; useful for tests and custom practice sets. */
export function createSessionFromQuestions(difficulty: Difficulty, questions: GeneratedQuestion[]): SessionState {
  return {
    difficulty,
    questions,
    currentQuestionIndex: 0,
    currentStep: 1,
    equation: questions[0].equation,
    stepHistory: [],
    phase: { name: "question_intro" },
    combo: 0,
    records: [],
    hintsUsedThisQuestion: 0,
    skillTallies: emptySkillTallies(),
  };
}

export function createSession(difficulty: Difficulty, rng: RandomSource, questionCount = 10): SessionState {
  return createSessionFromQuestions(difficulty, generateSession(difficulty, questionCount, rng));
}

export type SessionEvent =
  | { type: "CONTINUE" }
  | { type: "SUBMIT_RULE"; rule: Rule }
  | { type: "REQUEST_HINT" }
  | { type: "SELECT_SIMPLIFICATION_TARGET"; targetId: string }
  | { type: "SUBMIT_SIMPLIFICATION"; targetId: string; answer: SimplificationAnswer }
  | { type: "UNDO_SIMPLIFICATION" }
  | { type: "RESTART_QUESTION" }
  | { type: "SKIP_QUESTION" };

function skillForStep(step: StepNumber): SkillId {
  return step === 1 ? "make-x-positive" : step === 2 ? "choose-inverse" : "divide-coefficient";
}

function recordSkill(
  tallies: Record<SkillId, SkillTally>,
  skill: SkillId,
  correctFirstTry: boolean,
): Record<SkillId, SkillTally> {
  const current = tallies[skill];
  return {
    ...tallies,
    [skill]: {
      attempts: current.attempts + 1,
      correctFirstTry: current.correctFirstTry + (correctFirstTry ? 1 : 0),
    },
  };
}

/** True when the given rule's category is "wrong" but this is the learner's first attempt on this step. */
function isFirstAttempt(phase: PracticePhase): boolean {
  return phase.name === "enter_rule" && phase.lastFeedbackCategory === null;
}

function buildSimplificationTargets(preRuleEquation: Equation, rule: Rule, expanded: Equation): SimplificationTarget[] {
  const targets: SimplificationTarget[] = [];

  if (!isAddSubtract(rule)) {
    const scaleRule = rule;
    (["left", "right"] as const).forEach((side) => {
      preRuleEquation[side].forEach((term, index) => {
        targets.push({
          id: `${side}-scale-${index}`,
          side,
          kind: "scale",
          beforeTerms: [term],
          operation: { kind: scaleRule.kind, value: scaleRule.value },
          expected: expanded[side][index],
          isCancellation: false,
        });
      });
    });
    return targets;
  }

  const addSubtractRule = rule;
  const addedVariable = addSubtractRule.term.variable;
  (["left", "right"] as const).forEach((side) => {
    const existing = preRuleEquation[side].find((t) => t.variable === addedVariable);
    if (!existing) return; // Nothing of this kind already on this side: no merge needed.

    const newTerm: Term =
      addSubtractRule.kind === "add"
        ? addSubtractRule.term
        : { coefficient: negate(addSubtractRule.term.coefficient), variable: addSubtractRule.term.variable };
    const group = { terms: [existing, newTerm] };
    targets.push({
      id: `${side}-merge`,
      side,
      kind: "merge",
      beforeTerms: group.terms,
      expected: expectedTermForMergeGroup(group),
      isCancellation: isCancellationGroup(group),
    });
  });

  return targets;
}

/** Rebuilds the displayed equation for the active step from scratch, so undo is just removing an id. */
export function computeDisplayEquation(
  preRuleEquation: Equation,
  rule: Rule,
  targets: SimplificationTarget[],
  resolvedIds: string[],
): Equation {
  const isScale = rule.kind === "multiply" || rule.kind === "divide";
  const base: Equation = isScale ? preRuleEquation : applyRuleToBothSides(preRuleEquation, rule);

  const sides: Record<"left" | "right", EquationSide> = { left: [...base.left], right: [...base.right] };

  for (const target of targets) {
    if (!resolvedIds.includes(target.id)) continue;
    if (target.kind === "merge") {
      sides[target.side] = simplifySide(sides[target.side]);
    } else {
      const index = Number(target.id.split("-scale-")[1]);
      sides[target.side] = sides[target.side].map((t, i) => (i === index ? target.expected : t));
    }
  }

  return { left: sides.left, right: sides.right };
}

type StepTransitionResult = { equation: Equation; step: StepNumber; phase: PracticePhase };

function startStep(equation: Equation, step: StepNumber): StepTransitionResult {
  const ideal = idealRuleForStep(equation, step);
  if (ideal === null) {
    // Step already satisfied: record it and move on without inventing a no-op rule.
    return advanceAfterStep(equation, step);
  }
  return { equation, step, phase: { name: "enter_rule", hintLevel: 0, lastFeedbackCategory: null } };
}

function advanceAfterStep(equation: Equation, step: StepNumber): StepTransitionResult {
  if (step < 3) {
    return startStep(equation, (step + 1) as StepNumber);
  }
  return { equation, step, phase: { name: "question_complete" } };
}

function computeOutcome(hintsUsed: number, reachedMaxHint: boolean): QuestionOutcome {
  if (hintsUsed === 0) return "independent";
  return reachedMaxHint ? "guidance" : "hint";
}

export function reduceSession(state: SessionState, event: SessionEvent): SessionState {
  const phase = state.phase;

  switch (event.type) {
    case "CONTINUE": {
      if (phase.name === "question_intro") {
        // inspect_sign is a system computation, not a learner decision, so it never
        // needs its own render frame: resolve it synchronously within this transition.
        const { equation, step, phase: nextPhase } = startStep(state.equation, state.currentStep);
        return { ...state, equation, currentStep: step, phase: nextPhase };
      }
      if (phase.name === "rule_feedback") {
        if (phase.category !== "correct") {
          // Let the learner try again on the same step.
          return {
            ...state,
            phase: { name: "enter_rule", hintLevel: 0, lastFeedbackCategory: phase.category },
          };
        }
        const preRuleEquation = state.equation;
        const expanded = applyRuleToBothSides(preRuleEquation, phase.rule);
        const targets = buildSimplificationTargets(preRuleEquation, phase.rule, expanded);
        if (targets.length === 0) {
          // Nothing to simplify (rare, but possible if a scale rule is a no-op); go straight to step_complete.
          return {
            ...state,
            equation: canonicaliseEquation(expanded),
            stepHistory: [...state.stepHistory, preRuleEquation],
            phase: { name: "step_complete" },
          };
        }
        return {
          ...state,
          phase: {
            name: "choose_simplification",
            rule: phase.rule,
            preRuleEquation,
            targets,
            resolvedIds: [],
            selectedTargetId: null,
            lastFeedbackCategory: null,
          },
        };
      }
      if (phase.name === "step_complete") {
        const { equation, step, phase: nextPhase } = advanceAfterStep(state.equation, state.currentStep);
        return { ...state, equation, currentStep: step, phase: nextPhase };
      }
      if (phase.name === "question_complete") {
        const record: QuestionRecord = {
          question: state.questions[state.currentQuestionIndex],
          hintsUsed: state.hintsUsedThisQuestion,
          outcome: computeOutcome(state.hintsUsedThisQuestion, state.hintsUsedThisQuestion >= 4),
        };
        const nextIndex = state.currentQuestionIndex + 1;
        if (nextIndex >= state.questions.length) {
          return { ...state, records: [...state.records, record], phase: { name: "session_complete" } };
        }
        return {
          ...state,
          records: [...state.records, record],
          currentQuestionIndex: nextIndex,
          currentStep: 1,
          equation: state.questions[nextIndex].equation,
          stepHistory: [],
          hintsUsedThisQuestion: 0,
          combo: state.combo,
          phase: { name: "question_intro" },
        };
      }
      return state;
    }

    case "SUBMIT_RULE": {
      if (phase.name !== "enter_rule") return state;
      const feedback = classifyRuleAttempt(state.equation, state.currentStep, event.rule);
      const skill = skillForStep(state.currentStep);
      const firstAttempt = isFirstAttempt(phase);
      const skillTallies = firstAttempt
        ? recordSkill(state.skillTallies, skill, feedback.category === "correct")
        : state.skillTallies;
      return {
        ...state,
        skillTallies,
        combo: feedback.category === "correct" ? state.combo + 1 : 0,
        phase: { name: "rule_feedback", category: feedback.category, rule: event.rule },
      };
    }

    case "REQUEST_HINT": {
      if (phase.name !== "enter_rule") return state;
      const nextLevel = Math.min(4, phase.hintLevel + 1) as HintLevel;
      return {
        ...state,
        hintsUsedThisQuestion: state.hintsUsedThisQuestion + (nextLevel !== phase.hintLevel ? 1 : 0),
        phase: { ...phase, hintLevel: nextLevel },
      };
    }

    case "SELECT_SIMPLIFICATION_TARGET": {
      if (phase.name !== "choose_simplification") return state;
      return { ...state, phase: { ...phase, selectedTargetId: event.targetId, lastFeedbackCategory: null } };
    }

    case "SUBMIT_SIMPLIFICATION": {
      if (phase.name !== "choose_simplification") return state;
      const target = phase.targets.find((t) => t.id === event.targetId);
      if (!target) return state;

      const feedback = classifySimplificationAttempt(target.expected, event.answer, {
        isCancellation: target.isCancellation,
      });
      const isFraction = target.expected.coefficient.denominator !== 1;
      const skillTallies = recordSkill(
        isFraction ? state.skillTallies : state.skillTallies,
        isFraction ? "fractions" : "simplify-numbers",
        feedback.category === "correct",
      );

      if (feedback.category !== "correct") {
        return {
          ...state,
          skillTallies,
          combo: 0,
          phase: { ...phase, selectedTargetId: event.targetId, lastFeedbackCategory: feedback.category },
        };
      }

      const resolvedIds = [...phase.resolvedIds, target.id];
      const allResolved = resolvedIds.length === phase.targets.length;

      if (!allResolved) {
        return {
          ...state,
          skillTallies,
          combo: state.combo + 1,
          phase: { ...phase, resolvedIds, selectedTargetId: null, lastFeedbackCategory: "correct" },
        };
      }

      const finalEquation = canonicaliseEquation(
        computeDisplayEquation(phase.preRuleEquation, phase.rule, phase.targets, resolvedIds),
      );
      return {
        ...state,
        skillTallies,
        combo: state.combo + 1,
        equation: finalEquation,
        stepHistory: [...state.stepHistory, phase.preRuleEquation],
        phase: { name: "step_complete" },
      };
    }

    case "UNDO_SIMPLIFICATION": {
      if (phase.name !== "choose_simplification") return state;
      if (phase.resolvedIds.length === 0) return state;
      const resolvedIds = phase.resolvedIds.slice(0, -1);
      return { ...state, phase: { ...phase, resolvedIds, selectedTargetId: null, lastFeedbackCategory: null } };
    }

    case "RESTART_QUESTION": {
      const question = state.questions[state.currentQuestionIndex];
      return {
        ...state,
        currentStep: 1,
        equation: question.equation,
        stepHistory: [],
        hintsUsedThisQuestion: 0,
        phase: { name: "question_intro" },
      };
    }

    case "SKIP_QUESTION": {
      const record: QuestionRecord = {
        question: state.questions[state.currentQuestionIndex],
        hintsUsed: state.hintsUsedThisQuestion,
        outcome: "guidance",
      };
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, records: [...state.records, record], phase: { name: "session_complete" } };
      }
      return {
        ...state,
        records: [...state.records, record],
        currentQuestionIndex: nextIndex,
        currentStep: 1,
        equation: state.questions[nextIndex].equation,
        stepHistory: [],
        hintsUsedThisQuestion: 0,
        phase: { name: "question_intro" },
      };
    }

    default:
      return state;
  }
}

/** UI-facing helper: can the learner Skip yet? Only after the strongest hint or several failed attempts. */
export function canSkip(state: SessionState): boolean {
  return state.phase.name === "enter_rule" && (state.phase.hintLevel >= 4 || state.hintsUsedThisQuestion >= 4);
}

/** The equation currently shown on the equation stage, accounting for in-progress simplification. */
export function displayedEquation(state: SessionState): Equation {
  const phase = state.phase;
  if (phase.name === "choose_simplification") {
    return computeDisplayEquation(phase.preRuleEquation, phase.rule, phase.targets, phase.resolvedIds);
  }
  return state.equation;
}

export type SessionSummary = {
  questionsSolved: number;
  strongestSkill: SkillId | null;
  weakestSkill: SkillId | null;
  skillTallies: Record<SkillId, SkillTally>;
};

export function summariseSession(state: SessionState): SessionSummary {
  const relevant = (Object.entries(state.skillTallies) as [SkillId, SkillTally][]).filter(
    ([, tally]) => tally.attempts > 0,
  );
  const ratio = (tally: SkillTally) => tally.correctFirstTry / tally.attempts;
  const strongest = relevant.length
    ? relevant.reduce((best, current) => (ratio(current[1]) > ratio(best[1]) ? current : best))[0]
    : null;
  const weakest = relevant.length
    ? relevant.reduce((worst, current) => (ratio(current[1]) < ratio(worst[1]) ? current : worst))[0]
    : null;

  return {
    questionsSolved: state.records.length,
    strongestSkill: strongest,
    weakestSkill: weakest,
    skillTallies: state.skillTallies,
  };
}

export function isEquationSolved(equation: Equation): boolean {
  const isSolvedSide = (side: EquationSide) =>
    side.length === 1 && side[0].variable === "x" && equalsRational(side[0].coefficient, { numerator: 1, denominator: 1 });
  return isSolvedSide(equation.left) || isSolvedSide(equation.right);
}

export function isZeroTerm(term: Term): boolean {
  return isZero(term.coefficient);
}
