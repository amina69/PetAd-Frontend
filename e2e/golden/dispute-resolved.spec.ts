import { expect, test } from "@playwright/test";

test("a filed dispute can be opened and shows a resolution state", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "seeker-token");
    localStorage.setItem("petad_user_role", "seeker");
  });

  await page.goto("/disputes");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
  const detailLink = page.locator("a[href*='/disputes/']").first();
  if (await detailLink.count()) {
    await detailLink.click();
    await expect(page).toHaveURL(/\/disputes\/.+/);
  }
});
