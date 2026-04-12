// Import Playwright's config helper — gives us full TypeScript autocomplete
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where Playwright looks for test files — separate from Vitest's __tests__ folder
  testDir: "./e2e",

  // Run all tests in a file in parallel — speeds up the suite significantly
  fullyParallel: true,

  // Fail the CI build if you accidentally left test.only() in a file
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI — flaky network/animation issues often pass on retry
  retries: process.env.CI ? 1 : 0,

  // Number of parallel workers — CI gets 1 to avoid resource contention
  workers: process.env.CI ? 1 : undefined,

  // Output formats — list in terminal, HTML report you can open in a browser
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // The base URL of the running dev server — all page.goto('/books') calls use this
    baseURL: "http://localhost:3000",

    // Record a trace on the first retry so you can inspect failures step by step
    trace: "on-first-retry",

    // Take a screenshot automatically when a test fails
    screenshot: "only-on-failure",

    // Give each action up to 10 seconds before timing out
    actionTimeout: 10_000,
  },

  projects: [
    // We only test in Chromium — enough for a portfolio project
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Automatically start the Vite dev server before running tests
  // Playwright waits for the URL to be ready before launching browsers
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
