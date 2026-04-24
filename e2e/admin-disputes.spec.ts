import { expect, test } from "@playwright/test";

test.describe("Admin disputes SLA filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/disputes");
    await expect(
      page.getByRole("heading", { name: "Disputes Administration" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows only SLA-breached disputes when filter is enabled", async ({ page }) => {
    await expect(page.getByText("Bella")).toBeVisible();

    await page.getByText("SLA Breached Only").click();

    await expect(page.getByText("Bella")).toHaveCount(0);

    const slaBadges = page.locator('[data-testid="dispute-sla-badge"]');
    await expect(slaBadges).toHaveCount(2);
    await expect(slaBadges.filter({ hasText: "Within SLA" })).toHaveCount(0);
    await expect(slaBadges.filter({ hasText: "SLA Breached" })).toHaveCount(2);
  });

  test("shows empty state for no-result filter combination", async ({ page }) => {
    await page.getByLabel("Status:").selectOption("closed");
    await page.getByText("SLA Breached Only").click();

    await expect(page.getByText("No disputes found", { exact: true })).toBeVisible();
    await expect(
      page.getByText('No disputes found for status "closed" with SLA breached.'),
    ).toBeVisible();
  });
});
