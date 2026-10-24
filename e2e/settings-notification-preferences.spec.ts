import { expect, test } from "@playwright/test";

/**
 * C29. NotificationPreferences under account settings.
 *
 * Toggles a preference, hard-reloads the page and asserts the value survived
 * (round-trip through the API). The failed-save rollback is covered by the
 * component tests: MSW serves these requests from its service worker, which
 * `page.route()` cannot intercept.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/624
 */

const SETTINGS_PATH = "/settings/notifications";

test.describe("Settings › notification preferences", () => {
  test("a toggled preference persists across a hard reload", async ({ page }) => {
    await page.goto(SETTINGS_PATH);
    const toggle = page.getByRole("switch", { name: "Dispute raised" });
    await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 15_000 });

    const patch = page.waitForRequest(
      (request) =>
        request.url().endsWith("/api/notifications/preferences") &&
        request.method() === "PATCH",
    );
    await toggle.click();
    expect(JSON.parse((await patch).postData() ?? "{}")).toEqual({ DISPUTE_RAISED: false });
    await expect(toggle).toBeEnabled();

    await page.reload();
    await expect(page.getByRole("switch", { name: "Dispute raised" })).toHaveAttribute(
      "aria-checked",
      "false",
      { timeout: 15_000 },
    );
  });
});
