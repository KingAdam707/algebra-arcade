import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // Chromium-based mobile emulation (not iPhone SE/WebKit) so CI only needs
      // one browser engine installed; this suite verifies mobile viewport and
      // touch-target behaviour, not engine-specific rendering quirks.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
