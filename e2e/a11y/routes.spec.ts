import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const baseline = JSON.parse(
  readFileSync(new URL("./baseline.json", import.meta.url), "utf8"),
) as { violations: string[] };

const GUEST_ROUTES = ["/login", "/register", "/forgot-password", "/reset"];
const PUBLIC_ROUTES = ["/home", "/listings"];
const PROTECTED_ROUTES = [
  "/profile",
  "/favourites",
  "/interests",
  "/notifications",
  "/notification-preferences",
  "/settings/notifications",
  "/list-for-adoption",
  "/admin/approvals",
  "/admin/disputes",
  "/shelter/approvals",
  "/disputes",
  "/preview-modal",
  "/adoption-completion-demo",
  "/status-polling-demo",
];

const accepted = new Set(baseline.violations);

async function openGuest(page: Page, route: string) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    localStorage.removeItem("petad_user_role");
  });
  await page.goto(route);
}

async function seriousViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}::${node.target.join(" ")}`),
    )
    .filter((id) => !accepted.has(id))
    .sort();
}

test.describe("axe baseline", () => {
  test.use({ colorScheme: "light" });

  for (const route of GUEST_ROUTES) {
    test(`guest ${route} has no new serious or critical violations`, async ({ page }) => {
      await openGuest(page, route);
      await expect(page.locator("body")).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`public ${route} has no new serious or critical violations`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  for (const route of PROTECTED_ROUTES) {
    test(`protected ${route} has no new serious or critical violations`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  test("notification dropdown has no new serious or critical violations", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /open notifications/i }).click();
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test("rating modal has no new serious or critical violations", async ({ page }) => {
    await page.goto("/preview-modal");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
});
