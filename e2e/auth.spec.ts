import { expect, test } from "@playwright/test";

test.describe("auth redirect round-trip", () => {
  // Start signed out: the project-level storage state is an authenticated session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("returns to the protected page after sign in", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Welcome Pet Lover!" })).toBeVisible();

    // The MSW login handler only accepts users that registered in this session
    // (its user store starts empty), so register one through the same mocked API
    // the app talks to. A 409 means an earlier run in this session already did.
    const status = await page.evaluate(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "ada@example.com",
          fullName: "Ada Lovelace",
          nin: "12345678901",
          password: "secret123",
        }),
      });
      return response.status;
    });
    expect([201, 409]).toContain(status);

    await page.getByLabel("Email Address").fill("ada@example.com");
    await page.getByLabel("Password", { exact: true }).fill("secret123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
