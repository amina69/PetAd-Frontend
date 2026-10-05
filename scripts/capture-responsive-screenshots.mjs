#!/usr/bin/env node
/**
 * Capture responsive screenshots of all Phase 3 screens at the breakpoints
 * required by issue #553: 375px (mobile), 768px (tablet), 1280px (desktop).
 *
 * For each screen × breakpoint it captures a full-page PNG into
 * docs/qa/responsive-phase3/ and reports, on stdout as JSON lines:
 *   - horizontal overflow (scrollWidth > clientWidth → layout bug)
 *   - console/page errors
 *   - failed (4xx/5xx) API responses
 *
 * Prerequisites: a dev server with MSW enabled, e.g.
 *   VITE_MSW=true npm run dev -- --host 127.0.0.1 --port 4321
 *
 * Usage:
 *   node scripts/capture-responsive-screenshots.mjs            # all breakpoints
 *   node scripts/capture-responsive-screenshots.mjs 375        # one breakpoint
 *
 * Auth-gated screens are unlocked by seeding localStorage with a dummy
 * auth_token (see useAuth.ts — it only checks token presence).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4321";
const OUT_DIR = path.resolve("docs/qa/responsive-phase3");

const VIEWPORTS = [
  { width: 375, height: 812 }, // mobile
  { width: 768, height: 1024 }, // tablet
  { width: 1280, height: 900 }, // desktop
];

/** Phase 3 screens: approval, dispute, adoption/custody status tracking,
 *  escrow settlement, and notification flows (see #538, #550, #552). */
const SCREENS = [
  { slug: "adoption-timeline", route: "/adoption/adoption-1/timeline" },
  { slug: "custody-timeline", route: "/custody/custody-1/timeline" },
  { slug: "settlement-summary", route: "/adoption/adoption-1/settlement" },
  { slug: "admin-approvals", route: "/admin/approvals" },
  { slug: "shelter-approvals", route: "/shelter/approvals" },
  { slug: "my-disputes", route: "/disputes" },
  { slug: "dispute-detail", route: "/disputes/dispute-001" },
  { slug: "admin-disputes", route: "/admin/disputes" },
  { slug: "notifications", route: "/notifications" },
  { slug: "notification-preferences", route: "/notification-preferences" },
  { slug: "notification-settings", route: "/settings/notifications" },
];

const onlyWidths = process.argv.slice(2).map(Number).filter(Boolean);
const viewports = VIEWPORTS.filter(
  (v) => onlyWidths.length === 0 || onlyWidths.includes(v.width),
);

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });

for (const viewport of viewports) {
  for (const screen of SCREENS) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      localStorage.setItem("auth_token", "qa-responsive-audit");
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const failedResponses = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (err) =>
      consoleErrors.push(String(err.message).slice(0, 200)),
    );
    page.on("response", (res) => {
      if (res.status() >= 400) {
        failedResponses.push(`${res.status()} ${res.url().replace(BASE_URL, "")}`);
      }
    });

    let navError = null;
    try {
      await page.goto(`${BASE_URL}${screen.route}`, {
        waitUntil: "load",
        timeout: 30_000,
      });
    } catch (err) {
      navError = String(err.message).split("\n")[0].slice(0, 160);
    }
    // Let React Query + MSW mocked responses settle before capturing.
    await page.waitForTimeout(2_000);

    const metrics = await page.evaluate(() => ({
      heading:
        document.querySelector("h1")?.textContent?.trim().slice(0, 80) ?? null,
      overflow:
        Math.max(
          document.documentElement.scrollWidth,
          document.body?.scrollWidth ?? 0,
        ) - document.documentElement.clientWidth,
    }));

    const file = path.join(OUT_DIR, `${screen.slug}-${viewport.width}.png`);
    await page.screenshot({ path: file, fullPage: true });

    console.log(
      JSON.stringify({
        screen: screen.slug,
        route: screen.route,
        width: viewport.width,
        heading: metrics.heading,
        horizontalOverflowPx: Math.max(0, metrics.overflow),
        consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
        failedResponses: [...new Set(failedResponses)].slice(0, 5),
        navError,
        file: path.relative(process.cwd(), file),
      }),
    );

    await context.close();
  }
}

await browser.close();
console.log(JSON.stringify({ done: true, viewports: viewports.map((v) => v.width) }));
