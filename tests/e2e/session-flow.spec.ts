import { expect, test, type Page } from "@playwright/test";
import { constantTerm, xTerm } from "../../domain/equation";
import { fromInt } from "../../domain/rational";
import { createSessionFromQuestions } from "../../state/session-machine";

const ACTIVE_SESSION_KEY = "algebra-arcade:v1:active-session";

const QUESTION = {
  equation: { left: [xTerm(fromInt(2)), constantTerm(fromInt(-6))], right: [constantTerm(fromInt(10))] },
  solution: fromInt(8),
  difficulty: "easy" as const,
  startingCoefficientSign: "positive" as const,
  xOnLeft: true,
};

async function seedSession(page: Page) {
  const session = createSessionFromQuestions("easy", [QUESTION]);
  await page.goto("/");
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [ACTIVE_SESSION_KEY, JSON.stringify(session)] as const,
  );
  await page.goto("/play");
}

test("resumes an in-progress session after a refresh", async ({ page }) => {
  await seedSession(page);
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByTestId("rule-op-add").click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("button", { name: "Apply to both sides" }).click();
  await expect(page.getByText("That's the RULE")).toBeVisible();

  await page.reload();

  // Every dispatch persists the session, so refreshing mid-step keeps the exact
  // phase the learner was in rather than dropping them back to "/" or restarting.
  await expect(page).toHaveURL(/\/play/);
  await expect(page.getByText("That's the RULE")).toBeVisible();
});

test("reflows at 320px with no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await seedSession(page);
  await page.getByRole("button", { name: "Begin" }).click();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});

test("completes the RULE step using only the keyboard", async ({ page }) => {
  await seedSession(page);
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.getByText("Get the x-term on its own")).toBeVisible();

  await page.getByTestId("rule-op-add").focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "6", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Apply to both sides" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("That's the RULE")).toBeVisible();
});

test("never shows a generic 'Wrong' response", async ({ page }) => {
  await seedSession(page);
  await page.getByRole("button", { name: "Begin" }).click();
  // Sign error: subtract instead of add.
  await page.getByTestId("rule-op-subtract").click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("button", { name: "Apply to both sides" }).click();

  await expect(page.getByText(/^Wrong!?$/)).toHaveCount(0);
  await expect(page.getByText("That changes the equation", { exact: false })).toBeVisible();
});
