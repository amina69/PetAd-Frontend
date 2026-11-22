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

  /**
   * Chromium is the default local browser. Firefox and WebKit run when CI
   * (or a local matrix) sets E2E_BROWSERS, for example `E2E_BROWSERS=firefox`.
   * Upload fixtures live in `e2e/fixtures/`.
   */
  projects: (() => {
    const enabled = new Set(
      (process.env.E2E_BROWSERS ?? "chromium")
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    );

    const deviceByBrowser = {
      chromium: "Desktop Chrome",
      firefox: "Desktop Firefox",
      webkit: "Desktop Safari",
    } as const;

    const setupBrowser =
      (["chromium", "firefox", "webkit"] as const).find((name) => enabled.has(name)) ??
      "chromium";

    const browserProjects = (["chromium", "firefox", "webkit"] as const)
      .filter((name) => enabled.has(name))
      .map((name) => ({
        name,
        use: {
          ...devices[deviceByBrowser[name]],
          storageState: AUTH_STATE_PATH,
        },
        dependencies: ["setup"],
        testIgnore: /auth\.setup\.ts/,
      }));

    return [
      /**
       * Seeds an authenticated session once, then shares it with every browser
       * project below. Uses the same browser the job installed so a Firefox or
       * WebKit matrix leg does not try to launch Chromium.
       */
      {
        name: "setup",
        testMatch: /auth\.setup\.ts/,
        use: { ...devices[deviceByBrowser[setupBrowser]] },
      },
      ...browserProjects,
    ];
  })(),
});
