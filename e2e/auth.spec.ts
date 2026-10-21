import { expect, test } from "@playwright/test";

test.describe("auth redirect round-trip", () => {
  test("returns to the protected page after sign in", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome Pet Lover!" })).toBeVisible();

    await page.getByLabel("Email Address").fill("ada@example.com");
    await page.getByLabel("Password").fill("secret123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
