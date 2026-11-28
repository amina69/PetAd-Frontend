import { expect, test, type Page, type TestInfo } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

async function verifyLayout(page: Page, testInfo: TestInfo, route: string, heading: RegExp) {
  await page.goto(`${route}?locale=en-XA`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-XA");
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(375);
  await testInfo.attach(`en-XA${route.replace("/", "-")}`, {
    body: await page.screenshot({ fullPage: true, animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("public pages", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("pseudo-localised home fits a 375 px viewport", async ({ page }, testInfo) => {
    await verifyLayout(page, testInfo, "/home", /WÉLCÔMÉ PÉT LÔVÉR/);
  });

  test("pseudo-localised sign-in fits a 375 px viewport", async ({ page }, testInfo) => {
    await verifyLayout(page, testInfo, "/login", /Wélcômé Pét Lôvér/);
  });
});

test("pseudo-localised notifications fit a 375 px viewport", async ({ page }, testInfo) => {
  await verifyLayout(page, testInfo, "/notifications", /Nôtîfîcàtîôns/);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  expect(await tabs.evaluateAll((items) => items.every((item) => item.scrollWidth <= item.clientWidth)))
    .toBe(true);
});
