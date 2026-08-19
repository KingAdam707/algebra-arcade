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

test("arcade scene reflows on the start screen at 320px with no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.waitForTimeout(300);

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);

  // The two "side" scenes are display:none below the xl breakpoint (offsetParent is
  // null for hidden elements), so only assert on canvases actually laid out on screen.
  const visibleCanvasWidths = await page.$$eval("canvas", (canvases) =>
    canvases.filter((c) => c.offsetParent !== null).map((c) => c.clientWidth),
  );
  expect(visibleCanvasWidths.length).toBeGreaterThan(0);
  for (const width of visibleCanvasWidths) {
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(320);
  }
});

test("shows flanking side scenes on wide desktop but not on narrower screens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForTimeout(300);

  const wideCanvasCount = await page.$$eval(
    "canvas",
    (canvases) => canvases.filter((c) => c.offsetParent !== null).length,
  );
  // strip (1) + hero-or-nothing (0, hidden at this width) + two side scenes (2) = 3.
  expect(wideCanvasCount).toBe(3);

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.waitForTimeout(300);
  const narrowCanvasCount = await page.$$eval(
    "canvas",
    (canvases) => canvases.filter((c) => c.offsetParent !== null).length,
  );
  // Below xl: strip (1) + hero (1), no side scenes.
  expect(narrowCanvasCount).toBe(2);
});
