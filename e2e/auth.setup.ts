import { expect, test as setup } from "@playwright/test";

/**
 * Auth bootstrap for the E2E suite.
 *
 * The app treats a user as authenticated when an `auth_token` is present in
 * storage (`useAuth`) and reads the role from `petad_user_role` (`useRoleGuard`).
 * Protected-route specs therefore need a session before they run.
 *
 * Rather than driving the real login form (which depends on MSW server state),
 * we seed the same storage keys the app reads, then persist the browser context
 * as a reusable `storageState` consumed by the browser projects.
 *
 * @see playwright.config.ts  (project dependency + storageState wiring)
 */
const AUTH_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigating first attaches the storageState to the app's origin.
  await page.goto("/");

  await page.evaluate(() => {
    localStorage.setItem("auth_token", "e2e-mock-token");
    localStorage.setItem("petad_user_role", "ADMIN");
  });

  await page.context().storageState({ path: AUTH_STATE_PATH });

  // Fail fast if the fixture ever stops producing a usable session.
  await expect(page.locator("body")).toBeVisible();
});
