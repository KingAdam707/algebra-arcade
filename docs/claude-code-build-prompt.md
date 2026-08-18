# Claude Code build prompt for Algebra Arcade

Use this prompt together with `algebra-arcade-product-spec.md`.

```text
Build the Algebra Arcade MVP described in the attached product specification.

Read the entire specification before changing files. Treat it as the product contract. First inspect the existing repository, package manager, scripts, conventions, and any current work. Preserve unrelated changes.

Implementation priorities:

1. Build and test the exact rational-number and equation domain model first.
2. Implement rule application, equivalence checking, simplification, solving, question generation, and feedback classification as pure TypeScript independent of React.
3. Prove the complete learning loop with the two canonical equations from the specification.
4. Build the structured RULE editor and local simplification interactions. Do not use a blank full-equation text input.
5. Add the explicit practice state machine, difficulty generator, session persistence, results, responsive design, accessibility, and instructional motion.
6. Verify the complete experience with automated tests and a production build.

Technical direction:

- Use the repository's existing stack if it is compatible. Otherwise use Next.js App Router, TypeScript strict mode, Tailwind CSS 4.x, Motion, Vitest, and Playwright.
- Check package.json before importing any dependency. Install only what is required.
- Keep mathematical state separate from display and animation state.
- Never use floating-point arithmetic as the source of truth for fractions.
- Use semantic DOM for the equation and controls. Do not render the equation as an image, canvas, or single unstructured string.
- Honour prefers-reduced-motion and support keyboard, touch, screen readers, 320px reflow, and 200% zoom.
- Use one cohesive visual system. The product should feel modern and age-respectful, with restrained arcade energy rather than neon, glassmorphism, cartoons, or generic AI styling.
- Motion must communicate mathematical transformation or interface state. Do not add decorative motion with no instructional purpose.

Working method:

- Start by giving me a concise implementation plan based on what is actually in the repository.
- Then implement the plan. Do not stop after scaffolding or a static mock-up.
- Run targeted tests as each domain layer is added.
- Before finishing, run all tests, type checking, linting, and the production build.
- Inspect the finished UI at desktop and mobile sizes and fix visible layout issues.
- If the repository conflicts with the specification, explain the exact conflict and choose the smallest sensible adaptation.

Completion report:

- Summarise what was built.
- List the key files changed.
- Report the exact verification commands and whether each passed.
- Mention any intentionally deferred items from the specification.

The MVP is not complete unless a learner can solve both `2x − 6 = 10` and `24 − 4x = 8` through the full RULE, apply-to-both-sides, and guided-simplification flow.
```
