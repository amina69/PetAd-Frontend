import { defineConfig, devices } from "@playwright/test";

/** Where the auth setup project persists the reusable session. */
const AUTH_STATE_PATH = "e2e/.auth/user.json";

/**
 * Playwright configuration for the PetAd E2E suite.
 *
 * Chosen over Cypress for first-class parallelism (`fullyParallel` + worker
 * sharding) and built-in cross-browser support (Chromium, Firefox, WebKit)
 * with no extra plugins.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // Run every test file in parallel; individual tests within a file too.
  fullyParallel: true,

  // Fail the build if a test is accidentally left as `test.only`.
  forbidOnly: !!process.env.CI,

  // Retry only on CI to absorb infra flakiness; keep local runs strict.
  retries: process.env.CI ? 2 : 0,

  // Serialise workers on CI for deterministic, resource-bounded runs.
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  /**
   * Start the Vite dev server automatically so `npm run test:e2e` is
   * self-contained (works in a clean checkout with no server pre-running).
   * MSW is enabled so API-dependent pages render deterministic mock data.
   */
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/home",
    env: { VITE_MSW: "true" },
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    /**
     * Seeds an authenticated session once, then shares it with every browser
     * project below. Keeps protected-route specs focused on behaviour instead
     * of repeating login boilerplate.
     */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE_PATH },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], storageState: AUTH_STATE_PATH },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], storageState: AUTH_STATE_PATH },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
