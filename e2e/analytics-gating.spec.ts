import { expect, test } from "@playwright/test";

/**
 * Privacy gate: with VITE_ENABLE_ANALYTICS unset (the E2E dev server never
 * sets it), the app must make no analytics network calls.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Analytics gating", () => {
  test("makes no analytics network calls when the flag is off", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (/analytics|\/events\b|\/errors\b/i.test(new URL(request.url()).pathname)) {
        analyticsRequests.push(request.url());
      }
    });

    // Beacons bypass page.on('request') in some browsers, so spy on the API too.
    await page.addInitScript(() => {
      (window as unknown as { __beacons: string[] }).__beacons = [];
      navigator.sendBeacon = (url: string | URL) => {
        (window as unknown as { __beacons: string[] }).__beacons.push(String(url));
        return true;
      };
    });

    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "WELCOME PET LOVER!" })).toBeVisible();
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");

    expect(analyticsRequests).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __beacons: string[] }).__beacons)).toEqual([]);
  });
});
