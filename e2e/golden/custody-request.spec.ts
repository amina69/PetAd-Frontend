import { expect, test } from "@playwright/test";

test("caretaker custody timeline is reachable without another spec's state", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "caretaker-token");
    localStorage.setItem("petad_user_role", "caretaker");
  });

  await page.goto("/custody/custody-1/timeline");
  await expect(page).toHaveURL(/\/custody\/custody-1\/timeline/);
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
});
