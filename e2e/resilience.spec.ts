import { expect, test } from "@playwright/test";

test.describe("resilience states", () => {
  test("shows an offline banner and recovers when connectivity returns", async ({
    page,
    context,
  }) => {
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: "WELCOME PET LOVER!" }),
    ).toBeVisible();
    const banner = page.getByTestId("network-status-banner");

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(banner).toContainText("You are offline");

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(banner).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "WELCOME PET LOVER!" })).toBeVisible();
  });

  test("redirects to maintenance when an API request returns HTTP 503", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "CDP service-worker bypass is Chromium-only");
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: "WELCOME PET LOVER!" }),
    ).toBeVisible();

    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setBypassServiceWorker", { bypass: true });

    await page.route("**/api/resilience-test", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Service unavailable" }),
      }),
    );

    const errorMessage = await page.evaluate(async () => {
      const { apiClient } = await import("/src/lib/api-client.ts");
      try {
        await apiClient.get("/resilience-test");
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });
    expect(errorMessage).toContain("Service unavailable");

    await expect(page).toHaveURL(/\/maintenance$/);
    await expect(
      page.getByRole("heading", { name: "We’ll be back shortly" }),
    ).toBeVisible();
  });

  test("renders the public page under a throttled 3G connection", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "CDP network emulation is Chromium-only");
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: "WELCOME PET LOVER!" }),
    ).toBeVisible();

    const cdp = await context.newCDPSession(page);

    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 600,
      downloadThroughput: (750 * 1024) / 8,
      uploadThroughput: (250 * 1024) / 8,
    });

    await page.getByRole("button", { name: "I Want To Adopt" }).click();
    await expect(
      page.getByRole("heading", { name: /^Listings/ }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
