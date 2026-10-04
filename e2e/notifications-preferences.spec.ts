import { expect, test, type Page } from "@playwright/test";

/**
 * C16. Notification preferences persist across sessions.
 *
 * Toggles a preference off, performs a real page reload (not a component
 * remount), and asserts the value is still off — proving it round-trips
 * through the API layer instead of only living in local component state.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/481
 */

const PREFERENCES_PATH = "/notification-preferences";
const PATCH_URL = "/api/notifications/preferences";

/** Locator for the toggle knob (carries the translate-x-* state class). */
function toggleKnob(page: Page, label: string) {
  return page
    .getByText(label, { exact: true })
    .locator("..") // wrapper with the click handler
    .locator("div")
    .first() // track
    .locator("div")
    .first(); // knob
}

test.describe("Notification preferences persistence", () => {
  test("a disabled preference stays disabled after a real page reload", async ({
    page,
  }) => {
    await page.goto(PREFERENCES_PATH);
    await expect(
      page.getByRole("heading", { name: "Notification Preferences" }),
    ).toBeVisible({ timeout: 15_000 });

    const knob = toggleKnob(page, "Escrow Funded");

    // Defaults are enabled: knob is translated to the "on" position.
    await expect(knob).toHaveClass(/translate-x-4/);

    // Toggle off and wait for the persisted PATCH request.
    const patchRequest = page.waitForRequest(
      (request) =>
        request.url().endsWith(PATCH_URL) && request.method() === "PATCH",
    );
    await page.getByText("Escrow Funded", { exact: true }).click();

    const request = await patchRequest;
    const body = JSON.parse(request.postData() ?? "{}");
    expect(body.ESCROW_FUNDED).toBe(false);

    // Saved indicator confirms the mutation resolved.
    await expect(page.getByText("Saved")).toBeVisible();
    await expect(knob).not.toHaveClass(/translate-x-4/);

    // ── Real reload, not a component remount ──────────────────────────────
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Notification Preferences" }),
    ).toBeVisible({ timeout: 15_000 });

    const knobAfterReload = toggleKnob(page, "Escrow Funded");

    // If the value only lived in component state it would be re-enabled here.
    await expect(knobAfterReload).not.toHaveClass(/translate-x-4/);

    // Clean up so the shared mock backend is left in its default state.
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    const knobAfterReset = toggleKnob(page, "Escrow Funded");
    await expect(knobAfterReset).toHaveClass(/translate-x-4/);
  });
});
