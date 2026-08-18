# Algebra Arcade

A guided algebra practice web app for KS3 learners: solve one-variable linear equations by choosing a RULE, watching it apply to both sides, and simplifying step by step — never a blank equation text field.

Full product spec: [`docs/algebra-arcade-product-spec.md`](docs/algebra-arcade-product-spec.md).

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Motion · Vitest · Playwright

## Architecture

- `domain/` — pure TypeScript equation engine, independent of React: exact rational arithmetic, rule application, simplification, solving, question generation, and misconception-aware feedback classification.
- `state/` — explicit practice session state machine and versioned `localStorage` persistence.
- `content/` — feedback copy and the progressive hint ladder.
- `components/` — equation rendering, the RULE builder, and practice UI.
- `app/` — routes: `/` (start), `/play` (practice), `/results` (session summary).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck   # TypeScript strict mode
npm run lint         # ESLint
npm run test         # Vitest unit/domain tests
npm run test:e2e     # Playwright end-to-end tests
npm run build         # Production build
```
