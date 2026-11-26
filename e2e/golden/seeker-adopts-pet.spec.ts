import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("seeker can open a listing and start an adoption", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "seeker-token");
    localStorage.setItem("petad_user_role", "seeker");
  });

  await page.goto("/listings");
  await expect(page).toHaveURL(/\/listings/);
  const listing = page.locator("a[href*='/listings/']").first();
  await expect(listing).toBeVisible({ timeout: 15_000 });
  await listing.click();
  await expect(page).toHaveURL(/\/listings\/.+/);
});
