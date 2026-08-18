import { expect, test, type Page } from "@playwright/test";
import { constantTerm, xTerm } from "../../domain/equation";
import type { GeneratedQuestion } from "../../domain/generator";
import { fromInt } from "../../domain/rational";
import { createSessionFromQuestions } from "../../state/session-machine";

const ACTIVE_SESSION_KEY = "algebra-arcade:v1:active-session";

async function seedSession(page: Page, question: GeneratedQuestion) {
  const session = createSessionFromQuestions(question.difficulty, [question]);
  await page.goto("/");
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [ACTIVE_SESSION_KEY, JSON.stringify(session)] as const,
  );
  await page.goto("/play");
}

async function enterDigits(page: Page, digits: string) {
  for (const digit of digits) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
}

async function resolveSimplificationTarget(
  page: Page,
  targetId: string,
  digits: string,
  options: { variable?: boolean } = {},
) {
  await page.getByTestId(`simplify-target-${targetId}`).click();
  await enterDigits(page, digits);
  if (options.variable) {
    await page.getByRole("button", { name: "x", exact: true }).click();
  }
  await page.getByRole("button", { name: "Confirm" }).click();
}

test.describe("canonical example 1: 2x - 6 = 10", () => {
  test("solves through the full RULE, apply-to-both-sides, guided-simplification flow", async ({ page }) => {
    await seedSession(page, {
      equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] },
      solution: fromInt(8),
      difficulty: "easy",
      startingCoefficientSign: "positive",
      xOnLeft: true,
    });

    await page.getByRole("button", { name: "Begin" }).click();

    // Step 1 (already positive) auto-skips; step 2 needs RULE +6.
    await expect(page.getByText("Get the x-term on its own")).toBeVisible();
    await page.getByTestId("rule-op-add").click();
    await enterDigits(page, "6");
    await page.getByRole("button", { name: "Apply to both sides" }).click();
    await expect(page.getByText("That's the RULE")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await resolveSimplificationTarget(page, "left-merge", "0");
    await resolveSimplificationTarget(page, "right-merge", "16");

    await expect(page.getByText("Step complete.")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: divide by 2.
    await expect(page.getByText("Divide by the coefficient")).toBeVisible();
    await enterDigits(page, "2");
    await page.getByRole("button", { name: "Apply to both sides" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await resolveSimplificationTarget(page, "left-scale-0", "1", { variable: true });
    await resolveSimplificationTarget(page, "right-scale-0", "8");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Solved!")).toBeVisible();
    await expect(page.getByText("Solved independently")).toBeVisible();
  });
});

test.describe("canonical example 2: 24 - 4x = 8", () => {
  test("solves through the step-1 sign-fix, isolate, and divide flow", async ({ page }) => {
    await seedSession(page, {
      equation: { left: [constantTerm(fromInt(24)), xTerm(fromInt(-4))], right: [constantTerm(fromInt(8))] },
      solution: fromInt(4),
      difficulty: "easy",
      startingCoefficientSign: "negative",
      xOnLeft: true,
    });

    await page.getByRole("button", { name: "Begin" }).click();

    // Step 1: RULE +4x.
    await expect(page.getByText("Make the x-term positive")).toBeVisible();
    await page.getByTestId("rule-op-add").click();
    await enterDigits(page, "4");
    await page.getByRole("button", { name: "x", exact: true }).click();
    await page.getByRole("button", { name: "Apply to both sides" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await resolveSimplificationTarget(page, "left-merge", "0");
    await expect(page.getByText("Step complete.")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2: RULE -8.
    await expect(page.getByText("Get the x-term on its own")).toBeVisible();
    await page.getByTestId("rule-op-subtract").click();
    await enterDigits(page, "8");
    await page.getByRole("button", { name: "Apply to both sides" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await resolveSimplificationTarget(page, "left-merge", "16");
    await resolveSimplificationTarget(page, "right-merge", "0");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: divide by 4.
    await expect(page.getByText("Divide by the coefficient")).toBeVisible();
    await enterDigits(page, "4");
    await page.getByRole("button", { name: "Apply to both sides" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await resolveSimplificationTarget(page, "left-scale-0", "4");
    await resolveSimplificationTarget(page, "right-scale-0", "1", { variable: true });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Solved!")).toBeVisible();
  });
});
