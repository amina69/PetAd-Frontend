import { expect, test } from "@playwright/test";

test.describe("Notification preferences flow", () => {
  test("full preference save flow", async ({ page }) => {
    await page.goto("/notification-preferences");
    await expect(
      page.getByRole("heading", { name: "Notification Preferences" }),
    ).toBeVisible({ timeout: 15_000 });

    const label = page.getByText("Escrow Funded");
    const wrapper = label.locator("..");
    const track = wrapper.locator("div").first();
    const inner = track.locator("div").first();

    
    const classBefore = await inner.getAttribute("class");
    expect(classBefore).toContain("translate-x-4");

    // Toggle off and wait for PATCH /api/notifications/preferences
    await wrapper.click();
    const req = await page.waitForRequest((r) =>
      r.url().endsWith("/api/notifications/preferences") && r.method() === "PATCH",
    );

    const body = JSON.parse(req.postData() || "{}");
    expect(body.ESCROW_FUNDED).toBe(false);
    expect(body.APPROVAL_REQUESTED).toBe(true);
    expect(body.DISPUTE_RAISED).toBe(true);
    expect(body.SETTLEMENT_COMPLETE).toBe(true);
    expect(body.DOCUMENT_EXPIRING).toBe(true);
    expect(body.CUSTODY_EXPIRING).toBe(true);

    await expect(page.getByText("Saved")).toBeVisible();
    await page.waitForTimeout(100);

    const classAfter = await inner.getAttribute("class");
    expect(classAfter).not.toContain("translate-x-4");

    
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Notification Preferences" }),
    ).toBeVisible({ timeout: 15_000 });

    const innerAfterReload = page.getByText("Escrow Funded").locator("..").locator("div").first().locator("div").first();
    const classReload = await innerAfterReload.getAttribute("class");
    expect(classReload).not.toContain("translate-x-4");

    
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await page.getByRole("button", { name: "Reset" }).click();

    const resetReq = await page.waitForRequest((r) =>
      r.url().endsWith("/api/notifications/preferences") && r.method() === "PATCH",
    );
    const resetBody = JSON.parse(resetReq.postData() || "{}");
    for (const v of Object.values(resetBody)) {
      expect(v).toBe(true);
    }

    await expect(page.getByText("Saved")).toBeVisible();
    const innerAfterReset = page.getByText("Escrow Funded").locator("..").locator("div").first().locator("div").first();
    const classAfterReset = await innerAfterReset.getAttribute("class");
    expect(classAfterReset).toContain("translate-x-4");
  });
});
