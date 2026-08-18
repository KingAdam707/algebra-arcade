# Algebra Arcade

## Product and implementation specification

**Status:** MVP build brief  
**Audience:** UK Key Stage 3 learners, initially a Year 9 pupil revising Year 8 algebra  
**Primary topic:** Solving one-variable linear equations using a consistent three-step method  
**Working product name:** Algebra Arcade

## 1. Executive summary

Algebra Arcade is a guided algebra practice website for pupils who have forgotten some of the mechanics and reasoning behind solving equations. It should feel like a polished game, but teach like a calm tutor.

The first release focuses on equations such as:

- `2x − 6 = 10`
- `24 − 4x = 8`

The learner does not type an entire line of algebra into a blank box. Instead, the product guides them through a repeatable method:

1. Make the coefficient of `x` positive.
2. Isolate the `x`-term.
3. Divide by the coefficient of `x`.

At each step, the learner chooses a **RULE**, sees that rule applied to both the left-hand side and right-hand side, then simplifies the resulting expression. The interface gives specific, non-punitive feedback when the learner makes a mistake.

This aligns with the England Key Stage 3 curriculum, which calls for pupils to simplify expressions and solve linear equations in one variable. The Department for Education guidance also emphasises inverse operations, the meaning of the equals sign, and undoing operations on an unknown. See [the Key Stage 3 mathematics programme of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study) and [the Key Stage 3 mathematics guidance](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1056795/KS3_NonStatutory_Guidance_Sept_2021_FINAL_NCETM.pdf).

## 2. Problem statement

Many algebra practice tools have one of two weaknesses:

- They only check a final answer, so a pupil can get stuck without understanding the next move.
- They provide a completely blank equation editor, which adds input difficulty before the learner has mastered the mathematics.

A pupil who has forgotten Year 8 algebra needs more than a right or wrong response. They need to see:

- which part of the equation is currently blocking `x` from being isolated;
- which inverse operation removes it;
- why the same operation must be applied to both sides;
- how terms cancel or combine;
- how the equation changes without losing equality.

The product must provide that structure without solving every step for the learner.

## 3. Product goal

Help a learner become fluent and confident in solving simple one-variable linear equations by repeatedly using and understanding the same balance-preserving method.

### Learner outcome

After several sessions, the learner should be able to look at an equation such as `24 − 4x = 8` and independently reason:

1. The `x` coefficient is negative, so add `4x` to both sides.
2. The positive `x`-term is now on the right, so subtract `8` from both sides.
3. Divide both sides by `4`.
4. Therefore, `x = 4`.

### Product principles

- **Teach the transformation, not just the answer.**
- **Make equality visible.** Every operation visibly affects both sides.
- **Require useful thinking.** Do not turn the experience into repeatedly pressing Continue.
- **Reduce input friction.** Use structured controls and targeted answer slots.
- **Treat mistakes as information.** Explain the likely misconception and offer the next-smallest hint.
- **Be age-respectful.** Playful and energetic, but not childish.
- **Avoid time pressure.** Fluency matters more than speed in the MVP.

## 4. MVP scope

### Included

- One-variable linear equations.
- Exactly one `x`-term in the starting equation.
- The `x`-term may have a positive or negative integer coefficient.
- Integer constants in the starting equation.
- Integer solutions in Easy and Medium.
- Integer or simple positive rational solutions in Hard.
- Applying an operation to both sides.
- Combining numerical terms and cancelling opposite terms.
- Dividing both sides by the coefficient.
- Exact fraction arithmetic.
- Guided hints and misconception-aware feedback.
- Easy, Medium, and Hard practice sessions.
- Responsive desktop and mobile layouts.
- Keyboard, pointer, and touch operation.
- Local progress and session persistence without an account.

### Explicitly excluded from the MVP

- Equations containing `x` on both sides at the start.
- Brackets and expansion.
- Powers, quadratics, simultaneous equations, inequalities, and formula rearrangement.
- Standalone expression-simplification question sets.
- Negative solutions.
- Recurring decimals or awkward fractions.
- User accounts, cloud sync, social features, leaderboards, payments, and adverts.
- A countdown timer, lives, or punishment for hints.

Standalone simplifying-expression lessons should be a later module. Simplification is already practised inside every MVP equation.

## 5. Mathematical teaching model

### The invariant rule

The most important idea is:

> An equation stays balanced when the same valid operation is applied to both sides.

The interface should call the selected operation the **RULE**. It must not suggest that a term simply jumps across the equals sign and changes sign. The animation and wording should always show the actual operation on both sides.

### The learner-facing three-step method

#### Step 1: Make the `x`-term positive

Inspect the coefficient of `x`.

- If it is already positive, show: `The coefficient is +2, so Step 1 is already complete.`
- If it is negative, add the matching positive `x`-term to both sides.

Example:

```text
24 − 4x = 8
RULE: +4x

24 − 4x + 4x = 8 + 4x
24 = 8 + 4x
```

Do not describe this as moving `−4x` across the equals sign. Describe it as adding `4x` to both sides so `−4x + 4x` cancels to zero.

#### Step 2: Isolate the `x`-term

Remove the constant on the same side as the positive `x`-term by using its inverse operation.

Example A:

```text
2x − 6 = 10
RULE: +6

2x − 6 + 6 = 10 + 6
2x = 16
```

Example B, continuing from Step 1:

```text
24 = 8 + 4x
RULE: −8

24 − 8 = 8 + 4x − 8
16 = 4x
```

The learner-facing label may say `Get the x-term on its own`, but tutor copy should also introduce the precise word `isolate`.

#### Step 3: Divide by the coefficient

Divide both sides by the positive number multiplying `x`.

Example A:

```text
2x = 16
RULE: ÷2

2x ÷ 2 = 16 ÷ 2
x = 8
```

Example B:

```text
16 = 4x
RULE: ÷4

16 ÷ 4 = 4x ÷ 4
4 = x
x = 4
```

The final side swap from `4 = x` to `x = 4` may happen automatically, with the explanation: `Both forms mean the same thing. We usually write x first.`

### Terminology

Introduce terminology in context:

- **coefficient:** the number multiplying `x`;
- **constant:** a number without `x`;
- **term:** one part of an expression separated by `+` or `−`;
- **LHS:** left-hand side;
- **RHS:** right-hand side;
- **inverse operation:** an operation that undoes another operation;
- **equivalent equations:** equations with the same solution.

Never use a technical word without a short plain-language explanation the first time it appears.

## 6. Core learner experience

### Session structure

1. The learner selects Easy, Medium, or Hard.
2. A session contains 10 questions by default.
3. The learner completes each equation through the three-step rail.
4. Each step alternates between choosing a RULE and simplifying its result.
5. The session ends with a calm summary of strengths and areas to practise.

There is no countdown. A `combo` may count consecutive independently completed steps, but it must not reset dramatically or remove earned progress after a mistake.

### Main practice layout

The desktop practice screen has three main regions:

1. **Session header:** wordmark, difficulty, question count, progress, settings.
2. **Equation stage:** the current equation, transformation history, and active simplification.
3. **Method rail:** the three named steps, with the active step and a short explanation.

The **RULE panel** sits beside the current equation on desktop. On narrow screens it becomes a bottom panel directly below the equation. It must remain visually associated with the active equation in both layouts.

### Equation alignment

Use a stable three-column equation grid:

```text
[ left side, right aligned ] [ = ] [ right side, left aligned ]
```

The equals sign should remain visually stable during transformations. This reinforces the idea of balance. Do not render the equation as a single unstructured string.

### RULE builder

The learner should never type a complete algebraic expression.

The structured RULE builder contains:

- operation choices: `+`, `−`, `×`, `÷`;
- a number field or on-screen number pad;
- an `x` toggle when a variable term is valid;
- a live rule preview, such as `+ 4x` or `÷ 2`;
- an `Apply to both sides` button.

Only show controls relevant to the current step:

- Step 1 allows addition or subtraction of an `x`-term.
- Step 2 allows addition or subtraction of a constant.
- Step 3 allows division by a positive number.

Do not silently disable every invalid option. Allow enough freedom for the learner to reveal a misconception, then provide useful feedback.

### Applying a RULE

When a correct rule is submitted:

1. The RULE capsule briefly confirms.
2. It duplicates into two identical capsules.
3. One copy travels to the LHS and the other to the RHS.
4. The expanded equation is shown.
5. The learner is asked to simplify one meaningful group at a time.

For `RULE: +6`:

```text
2x − 6 = 10
        +6   +6
2x − 6 + 6 = 10 + 6
```

The duplication is instructional, not decorative. It shows exactly why the equation remains balanced.

### Guided simplification

Do not replace the expanded line with the simplified answer automatically.

Instead:

1. Visually group valid simplification targets, such as `−6 + 6` or `10 + 6`.
2. Ask the learner to select a group.
3. Open a small answer slot for only that group.
4. Use a number pad for numbers and an `x` token button where needed.
5. Confirm the local simplification, then smoothly compact the equation.

Example:

```text
2x − 6 + 6 = 10 + 6
     [____]     [____]
```

The expected local answers are `0` and `16`. When `−6 + 6` becomes `0`, the zero may briefly remain visible before the term fades from the canonical equation. This prevents cancellation from looking like unexplained disappearance.

For `−4x + 4x`, accept `0x` or `0`, explain that `0x = 0`, then remove the zero term.

Do not require the learner to simplify parts that are already in canonical form. For example, `8 + 4x` does not need reordering during Step 1.

### Transformation history

Keep the current equation prominent. Preserve the previous one or two transformations above it in a quieter style so the learner can see the chain of reasoning. On mobile, older transformations collapse under `Show previous lines` to preserve space.

### Controls

Always provide:

- `Hint`;
- `Undo last simplification`;
- `Restart this question` in an overflow menu;
- keyboard submission with Enter;
- Escape to close a popover or cancel the current local edit.

`Skip` should only appear after the learner has requested the strongest hint or spent substantial time on the question. Skipping must not be framed as failure.

## 7. Feedback and hint system

### Tone

Feedback should be brief, specific, and forward-looking.

Avoid:

- `Wrong!`
- red shaking screens;
- losing lives;
- sad characters;
- generic `Try again` with no explanation.

Prefer:

- `That changes the equation, but it does not remove −6 from the x side.`
- `Look at −6. Which operation makes it zero?`
- `You chose −6, which makes the constant farther from zero. The inverse of subtract 6 is add 6.`
- `Your arithmetic is close. 10 + 6 is greater than 10.`

### Error categories

The evaluator must distinguish at least these cases:

1. **Sign error:** correct magnitude, wrong operation.
2. **Magnitude error:** correct operation, wrong number.
3. **Missing variable:** learner enters `+4` instead of `+4x` in Step 1.
4. **Unhelpful but balance-preserving rule:** mathematically valid, but does not complete the active method step.
5. **Premature division:** learner tries to divide before isolating the `x`-term.
6. **Arithmetic error:** the selected rule is correct, but a local simplification is not.
7. **Fraction error:** numerator and denominator are swapped or the fraction is not reduced.
8. **Zero cancellation error:** opposite terms are combined incorrectly.

### Progressive hints

Use a four-level ladder:

1. **Prompt:** restate the goal of the active step.
2. **Notice:** highlight the blocking term or coefficient.
3. **Strategy:** name the inverse operation without giving the completed rule.
4. **Model:** show the rule, then require the learner to apply and simplify it.

Hints never block progress and never reduce a public score. The result screen may say `Solved independently`, `Solved with a hint`, or `Solved with guidance`.

### Alternate valid approaches

In Guided mode, acknowledge a mathematically valid alternative but keep the learner on the selected method:

> That operation keeps both sides balanced. In this method, we first remove the constant from the x side. Which operation cancels −6?

Do not label a valid alternative as mathematically wrong. A future Challenge mode can accept any equivalent sequence of valid transformations.

## 8. Difficulty system and question generation

Generate equations backwards from a chosen solution. This guarantees a valid answer and makes the constraints testable.

The MVP starting form is:

```text
a x + b = c
```

where `a` is a non-zero integer, `b` and `c` are integers, and `c = ax + b`. The renderer must format signs naturally:

- `2x + (−6)` becomes `2x − 6`;
- coefficient `1` becomes `x`;
- coefficient `−1` becomes `−x`;
- never show `+ −`;
- never show a denominator of `1`.

The sides may be swapped at generation time to vary visual structure, as long as there is still exactly one `x`-term in the starting equation.

### Easy

- Solution `x` is an integer from `1` to `4`.
- Absolute values of displayed constants are less than `10`.
- Coefficient magnitude is usually `1` to `4`.
- Final division always produces an integer.
- Approximately 30% of questions start with a negative `x` coefficient.
- Avoid more than two identical sign patterns in a row.

If a generated candidate breaks a displayed-value rule, discard it and generate another.

### Medium

- Solution `x` is an integer from `6` to `9`.
- Displayed non-zero constants have absolute values greater than `10` and less than `50`.
- Coefficient magnitude is usually `2` to `6`.
- Final division always produces an integer.
- Approximately 40% of questions start with a negative `x` coefficient.
- Include both left-side and right-side final `x` positions.

### Hard

- Solution is between `1` and `15`, inclusive.
- Solutions may be integers or reduced positive fractions.
- Allowed reduced denominators: `2`, `3`, `4`, or `5`.
- Displayed integer constants have absolute values no greater than `150`.
- Coefficient magnitude is usually `2` to `12`.
- Approximately 50% of questions start with a negative `x` coefficient.
- Include negative constants and varied side placement.
- No recurring decimals. Keep all arithmetic exact and display fractions, not decimal approximations.

To generate a fractional solution `p/q` while keeping displayed constants integral, choose a coefficient whose magnitude is a multiple of `q`.

### Generator safeguards

- Reject `a = 0`.
- Reject duplicate questions within a session.
- Reject questions that simplify to an identity or contradiction.
- Reject a starting equation already equal to `x = n`.
- Reject awkward zero-heavy questions unless the zero is pedagogically intentional.
- Reject any candidate outside its difficulty limits.
- Use a seeded random number generator in tests.

## 9. Progress and motivation

### During a session

Show:

- question position, such as `4 of 10`;
- a simple segmented progress track;
- current difficulty;
- an optional `combo` for independently correct steps.

Do not show a large numerical score while the learner is reasoning. It competes with the maths.

### End of session

Summarise performance by skill, not only total correctness:

- Making the `x`-term positive;
- Choosing inverse operations;
- Applying the same rule to both sides;
- Simplifying number terms;
- Dividing by the coefficient;
- Working with fractions, when relevant.

Example:

```text
8 equations solved
Strongest skill: keeping both sides balanced
Practise next: choosing the inverse of a negative constant
```

Offer `Practise this skill` and `Finish for now`. Keep the celebration short and reserved for session completion, not every arithmetic action.

### Persistence

Use versioned `localStorage` in the MVP for:

- selected difficulty;
- active session and current question;
- completed session summaries;
- hint use and misconception counts;
- theme and sound preference.

Do not collect a learner's name, age, school, or contact information.

## 10. Information architecture

### `/`

The start screen should include:

- Algebra Arcade wordmark;
- one-sentence value proposition;
- a real interactive equation preview, not a fake screenshot;
- difficulty selector presented as a single segmented track;
- `Start practice` primary action;
- `How the 3-step method works` secondary action.

If a session is stored locally, the primary action becomes `Continue session`, with `Start a new session` as the secondary action.

### `/play`

The focused practice experience. Avoid marketing navigation and distractions.

### `/results`

Session summary, skill breakdown, recommended next practice, and restart controls.

### Optional `/method`

A short explainer that demonstrates the two canonical examples interactively. Build this only after the core `/play` flow works.

## 11. Visual direction

### Design read

Reading this as: a guided learning product for 12 to 14-year-olds, with age-respectful arcade energy, strong mathematical clarity, and restrained game-like motion.

### Design dials

- `DESIGN_VARIANCE: 6/10` - distinctive, but the equation remains stable and easy to scan.
- `MOTION_INTENSITY: 5/10` - fluid instructional transitions and tactile controls, with no constant spectacle.
- `VISUAL_DENSITY: 5/10` - enough context to guide the learner without making the stage feel busy.

### Brand character

- Confident, encouraging, precise.
- Modern arcade, not retro pixel-art cosplay.
- No cartoon mascot in the MVP.
- No neon glow, purple mesh, glass panels, fake terminal UI, or childish school clip-art.
- Use the equals sign and balance as the central visual motif.

### Colour

Use one clear brand accent across the experience. A recommended direction is electric cobalt against cool off-white and deep ink neutrals.

- Light surface: cool off-white, never pure white everywhere.
- Dark surface: deep blue-black, not pure black.
- Brand accent: cobalt, adjusted between light and dark themes for contrast.
- Feedback must use icon, text, and shape in addition to colour.
- Error states should be calm neutral callouts with precise copy. Reserve danger red for genuinely destructive actions.

Support system light and dark mode with a manual override. Keep the chosen theme consistent across every section and route.

### Typography

- UI and brand: a clear modern sans such as Geist.
- Equations: a dedicated, highly legible math face such as STIX Two Math, or a carefully tested system math stack.
- Render the variable `x` in mathematical italic.
- Use tabular numerals where alignment benefits.
- Equations should use responsive sizing with `clamp()`, approximately `2rem` on small mobile screens to `4rem` on desktop.

### Shape system

Document and follow one rule:

- large stage panels: 20px radius;
- controls and inputs: 12px radius;
- RULE chips: 10px radius;
- full pills only for compact status labels or segmented selections.

Use shadows only where elevation communicates a real overlay. Prefer spacing, surface tint, and borders for normal grouping.

### Mobile behaviour

At widths below 768px:

- collapse to one column;
- keep the equation stage above the method rail;
- place the RULE builder directly below the equation;
- use a bottom-sheet-style number pad when helpful;
- keep primary controls within thumb reach;
- collapse older equation history;
- maintain at least 16px page gutters;
- do not allow horizontal page scrolling at 320 CSS pixels.

If an expanded equation is too wide, reduce term spacing and equation font size to a defined minimum. After that, wrap only at operator boundaries while preserving a clear LHS, equals sign, and RHS relationship.

## 12. Motion and interaction specification

Motion must explain hierarchy, state, or mathematical transformation.

### Required motion

- Button press: `scale(0.98)`, 120 to 160ms.
- Small panel or hint entrance: opacity plus `scale(0.97)` to `1`, 160 to 220ms, origin-aware.
- RULE duplication: 260 to 360ms, strong ease-out.
- Term regrouping: 220 to 320ms, ease-in-out.
- Cancellation: terms move slightly toward one another, resolve visibly to zero, then the canonical line compacts.
- Step completion: restrained colour and icon transition, no confetti.
- Session completion: one brief celebration, then settle.

Recommended curves:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

Never use `transition: all`. Animate only the specific properties required, preferably `transform` and `opacity`. Predetermined UI transitions should use CSS. Use Motion only for interruptible or geometry-aware transformations.

### Reduced motion

Respect `prefers-reduced-motion`. Replace travel, scaling, and regrouping movement with short opacity and colour changes. The mathematical intermediate lines must still appear, so reducing motion never removes explanation. Motion's current React API exposes `useReducedMotion` for this purpose: [Motion reduced-motion documentation](https://motion.dev/docs/react-use-reduced-motion).

### Sound

Sound is off by default. If added later, use subtle optional feedback and persist the preference. Never rely on sound to communicate correctness.

## 13. Accessibility and safeguarding

Target WCAG 2.2 AA. WCAG 2.2 includes minimum target size and focus visibility requirements; see the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) and [target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

Required:

- 44 by 44 CSS pixel target size as the product target, exceeding the 24 by 24 AA minimum where practical.
- Full keyboard operation.
- Visible focus rings that are not clipped or obscured.
- Semantic buttons, labels, headings, status regions, and progress markup.
- `aria-live="polite"` for feedback and equation-state announcements.
- Screen-reader text for symbols, for example `divide both sides by 2`.
- No colour-only meaning.
- Text and control contrast meeting WCAG AA.
- Text zoom and browser zoom up to 200% without loss of function.
- Reflow at 320 CSS pixels without horizontal page scrolling.
- Reduced-motion support.
- No forced autoplay, flashing, or rapid repeated animation.
- Touch, mouse, and keyboard paths must all reach the same outcomes.

For screen readers, announce transformed equations as complete natural-language statements. Do not make a user navigate every visual term token unless they enter an equation-inspection mode.

Because the target audience includes children, collect no personal data in the MVP and avoid manipulative streak loss, public rankings, or pressure notifications.

## 14. Technical architecture

### Recommended stack

- Next.js App Router with TypeScript.
- React components, keeping the equation engine independent of React.
- Tailwind CSS 4.x with CSS-first design tokens.
- Motion for the small number of geometry-aware animations.
- Vitest for domain and component tests.
- Playwright for end-to-end tests.
- No backend in the MVP.

The current official documentation supports the [Next.js App Router](https://nextjs.org/docs) and [Tailwind's Next.js installation flow](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Check the repository before installing dependencies and use mutually compatible current releases.

### Domain model

Do not use JavaScript floating-point numbers for mathematical truth. Represent every number as an exact rational:

```ts
type Rational = {
  numerator: number;
  denominator: number; // Always positive and reduced.
};

type Term = {
  coefficient: Rational;
  variable: "x" | null;
};

type EquationSide = Term[];

type Equation = {
  left: EquationSide;
  right: EquationSide;
};

type Rule =
  | { kind: "add" | "subtract"; term: Term }
  | { kind: "multiply" | "divide"; value: Rational };
```

Core pure functions:

```ts
applyRuleToBothSides(equation, rule): Equation
simplifySide(side): EquationSide
canonicaliseEquation(equation): Equation
isEquivalent(before, after): boolean
solveEquation(equation): Rational
classifyRuleAttempt(equation, step, rule): RuleFeedback
classifySimplificationAttempt(group, answer): SimplificationFeedback
generateQuestion(difficulty, random): GeneratedQuestion
formatEquation(equation): DisplayTokenTree
```

`isEquivalent` must verify algebraic equivalence, not compare formatted strings.

### State machine

Model the learner flow explicitly. Do not scatter it across unrelated booleans.

```text
question_intro
  -> inspect_sign
  -> enter_rule
  -> rule_feedback
  -> show_expanded_equation
  -> choose_simplification
  -> simplification_feedback
  -> step_complete
  -> next_step | question_complete
  -> session_complete
```

If Step 1 is already satisfied, `inspect_sign` records that fact and advances to Step 2 without inventing a no-op rule.

### Suggested component structure

```text
AppShell
StartScreen
DifficultySelector
PracticeSession
  SessionHeader
  EquationStage
    EquationHistory
    EquationLine
      EquationSide
      TermToken
    SimplificationTarget
  RuleBuilder
  MethodRail
  HintPanel
  MathNumberPad
ResultsScreen
SkillSummary
```

### Suggested project structure

```text
app/
  page.tsx
  play/page.tsx
  results/page.tsx
components/
  equation/
  practice/
  feedback/
  ui/
domain/
  rational.ts
  equation.ts
  solver.ts
  generator.ts
  evaluator.ts
  formatter.ts
content/
  feedback.ts
  method.ts
state/
  session-machine.ts
  persistence.ts
tests/
  unit/
  component/
  e2e/
```

Keep mathematical state separate from display state. Animations may render snapshots of `before`, `expanded`, and `simplified`, but must never become the source of truth.

## 15. Canonical end-to-end examples

### Example 1: `2x − 6 = 10`

1. Step 1 reports that the coefficient `2` is already positive.
2. Step 2 prompts for the constant blocking the `x`-term.
3. Learner enters `RULE: +6`.
4. Product shows `2x − 6 + 6 = 10 + 6`.
5. Learner simplifies `−6 + 6` to `0`.
6. Learner simplifies `10 + 6` to `16`.
7. Product shows `2x = 16` and completes Step 2.
8. Step 3 asks for the coefficient of `x`.
9. Learner enters `RULE: ÷2`.
10. Product shows `2x ÷ 2 = 16 ÷ 2`.
11. Learner simplifies both sides.
12. Product shows `x = 8`.
13. The answer is verified by substitution: `2(8) − 6 = 10`.

### Example 2: `24 − 4x = 8`

1. Step 1 identifies coefficient `−4`.
2. Learner enters `RULE: +4x`.
3. Product shows `24 − 4x + 4x = 8 + 4x`.
4. Learner simplifies `−4x + 4x` to `0`.
5. Product shows `24 = 8 + 4x` and completes Step 1.
6. Step 2 asks which constant is on the same side as `4x`.
7. Learner enters `RULE: −8`.
8. Product shows `24 − 8 = 8 + 4x − 8`.
9. Learner simplifies `24 − 8` to `16` and `8 − 8` to `0`.
10. Product shows `16 = 4x`.
11. Learner enters `RULE: ÷4`.
12. Product shows `16 ÷ 4 = 4x ÷ 4`.
13. Learner simplifies to `4 = x`.
14. Product normalises the presentation to `x = 4` and explains the side swap.
15. The answer is verified by substitution: `24 − 4(4) = 8`.

## 16. Testing requirements

### Unit tests

- Rational addition, subtraction, multiplication, division, sign normalisation, and reduction.
- Rule application changes both sides identically.
- Equation equivalence before and after every supported rule.
- Simplification combines constants and like terms correctly.
- Formatter handles `1x`, `−1x`, zero terms, negative constants, and fractions.
- Solver returns the exact rational solution.
- Feedback classifier identifies every error category.
- Generator produces no invalid or duplicate session questions.
- Run at least 10,000 seeded generator samples per difficulty and assert every constraint.

### Component tests

- RULE builder changes available inputs by step.
- Focus returns to the correct control after feedback.
- Correct and incorrect feedback are announced.
- Number pad and physical keyboard produce identical values.
- Hint levels advance without revealing too much too early.
- Undo restores the previous canonical equation.
- Reduced motion removes travel without removing intermediate maths.

### End-to-end tests

- Complete both canonical examples exactly as specified.
- Complete one full session in each difficulty.
- Resume a session after refresh.
- Use the entire practice flow by keyboard only.
- Use the flow at 320px wide without page-level horizontal scrolling.
- Test system light mode, system dark mode, and manual override.
- Test 200% text zoom.
- Verify no generic `Wrong` response appears.

### Quality checks

- TypeScript strict mode passes.
- Lint passes.
- Unit, component, and end-to-end tests pass.
- Production build passes.
- Lighthouse checks are run on start, play, and results routes.
- Target LCP under 2.5 seconds, INP under 200ms, and CLS under 0.1 on representative hardware.
- Manual test on a real touch device.

## 17. Definition of done

The MVP is complete only when:

- A learner can solve both canonical equations through the full guided flow.
- The interface visibly applies every RULE to both sides.
- The learner performs the important simplifications.
- The product provides targeted help for common misconceptions.
- Every generated question satisfies its difficulty contract.
- Fractions are calculated exactly.
- The experience works with touch, mouse, and keyboard.
- The experience reflows at 320px and supports 200% zoom.
- Reduced motion is respected.
- Refreshing does not destroy an active session.
- There are no blank full-equation text fields.
- There is no timer, lives system, public leaderboard, or personal-data collection.
- Tests and the production build pass.

## 18. Delivery sequence

Build in this order:

1. Exact rational and equation domain model.
2. Solver, rule application, simplifier, and generator tests.
3. Static responsive practice shell with the two fixed examples.
4. Explicit practice state machine.
5. RULE builder and targeted simplification controls.
6. Feedback classifier and progressive hints.
7. Generated Easy, Medium, and Hard sessions.
8. Local persistence and results summary.
9. Instructional motion and reduced-motion alternatives.
10. Accessibility, responsive, and end-to-end quality pass.

Do not begin with decorative landing-page polish. Prove the equation engine and the complete learning loop first, then make that loop beautiful.

## 19. Future expansion

Potential later modules:

- Simplifying expressions by collecting like terms.
- Equations with `x` on both sides.
- Brackets and expansion.
- Negative solutions.
- Fractional coefficients.
- Formula rearrangement.
- Challenge mode accepting any valid equivalent transformation.
- Optional parent or teacher view using anonymous local exports.
- Installable offline PWA.

These extensions should reuse the rational engine, tokenised equation renderer, transformation history, and misconception-aware feedback system built for the MVP.

