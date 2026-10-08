import { expect, test } from "@playwright/test";

/**
 * Smoke test — proves the E2E harness itself works (server boots, app renders,
 * browser launches) before other E2E specs depend on it.
 *
 * Runs as a guest: it validates the public entry point without the shared
 * authenticated session used by the protected-route specs.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Smoke test", () => {
  test("homepage loads and title matches", async ({ page }) => {
    await page.goto("/");

    // Document title comes from index.html.
    await expect(page).toHaveTitle("PetAd - Pet Adoption Platform");

    // The root route redirects to the public /home page.
    await expect(page).toHaveURL(/\/home$/);

    // The homepage hero heading is rendered and visible.
    await expect(
      page.getByRole("heading", { name: "WELCOME PET LOVER!" }),
    ).toBeVisible();
  });
});
