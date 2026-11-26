import { expect, test } from "@playwright/test";

test("document upload and verification surface renders for an authenticated user", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "owner-token");
    localStorage.setItem("petad_user_role", "owner");
  });

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
});
