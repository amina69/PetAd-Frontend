/**
 * Automated accessibility audit for all primary routes (issue #536).
 *
 * Uses @axe-core/playwright to inject axe-core into each route and collect
 * violations. Run against the dev server:
 *
 *   npx ts-node --esm scripts/a11y-audit.ts
 *
 * Or against a preview build:
 *
 *   npm run build && npm run preview &
 *   npx ts-node --esm scripts/a11y-audit.ts --base-url http://localhost:4173
 *
 * Output is written to docs/a11y-audit.md as a Markdown report.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";

/** Primary routes that must be audited for every release. */
const ROUTES: Array<{ path: string; label: string; requiresAuth?: boolean }> = [
  { path: "/home", label: "Home" },
  { path: "/listings", label: "Listings" },
  { path: "/listings/1", label: "Pet listing detail" },
  { path: "/login", label: "Sign in" },
  { path: "/register", label: "Register" },
  { path: "/forgot-password", label: "Forgot password" },
  { path: "/favourites", label: "Favourites", requiresAuth: true },
  { path: "/interests", label: "Interests", requiresAuth: true },
  { path: "/notifications", label: "Notifications", requiresAuth: true },
  { path: "/profile", label: "Profile", requiresAuth: true },
  { path: "/notification-preferences", label: "Notification preferences", requiresAuth: true },
  { path: "/settings/notifications", label: "Settings – Notifications", requiresAuth: true },
];

interface RouteResult {
  route: string;
  label: string;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
  violations: Array<{ id: string; impact: string; description: string; nodes: number }>;
  error?: string;
}

async function auditRoute(page: Page, route: { path: string; label: string }): Promise<RouteResult> {
  const url = `${BASE_URL}${route.path}`;
  const result: RouteResult = {
    route: route.path,
    label: route.label,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0,
    violations: [],
  };

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await injectAxe(page);

    const axeResults = await page.evaluate(() => {
      return new Promise<{ violations: Array<{ id: string; impact: string; description: string; nodes: unknown[] }> }>((resolve) => {
        (window as any).axe.run(document, {}, (_err: unknown, results: { violations: Array<{ id: string; impact: string; description: string; nodes: unknown[] }> }) => {
          resolve(results);
        });
      });
    });

    for (const v of axeResults.violations) {
      const impact = v.impact ?? "minor";
      result.violations.push({ id: v.id, impact, description: v.description, nodes: v.nodes.length });
      result.total += v.nodes.length;
      if (impact === "critical") result.critical += v.nodes.length;
      else if (impact === "serious") result.serious += v.nodes.length;
      else if (impact === "moderate") result.moderate += v.nodes.length;
      else result.minor += v.nodes.length;
    }
  } catch (err) {
    result.error = String(err);
  }

  await checkA11y(page, undefined, { detailedReport: false });
  return result;
}

function formatReport(results: RouteResult[], timestamp: string): string {
  const lines: string[] = [
    "# Accessibility Audit Baseline",
    "",
    `Generated: ${timestamp}`,
    "",
    "This file is the committed baseline produced by `scripts/a11y-audit.ts`.",
    "Re-run the script after every significant UI change and commit the updated report.",
    "",
    "## Summary",
    "",
    "| Route | Label | Critical | Serious | Moderate | Minor | Total violations |",
    "|-------|-------|----------|---------|----------|-------|-----------------|",
  ];

  for (const r of results) {
    if (r.error) {
      lines.push(`| \`${r.route}\` | ${r.label} | — | — | — | — | ⚠ error |`);
    } else {
      lines.push(`| \`${r.route}\` | ${r.label} | ${r.critical} | ${r.serious} | ${r.moderate} | ${r.minor} | ${r.total} |`);
    }
  }

  lines.push("", "## Violations by route", "");

  for (const r of results) {
    lines.push(`### ${r.label} (\`${r.route}\`)`);
    lines.push("");
    if (r.error) {
      lines.push(`**Error navigating to route:** ${r.error}`);
    } else if (r.violations.length === 0) {
      lines.push("No violations detected.");
    } else {
      lines.push("| Rule ID | Impact | Description | Affected nodes |");
      lines.push("|---------|--------|-------------|----------------|");
      for (const v of r.violations) {
        lines.push(`| \`${v.id}\` | ${v.impact} | ${v.description} | ${v.nodes} |`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Notes",
    "",
    "* Auth-gated routes are audited on the redirect or gate UI that unauthenticated",
    "  users see. Run with a valid session cookie to audit the authenticated view.",
    "* The \"Nearest\" sort option on the listings page is intentionally disabled when",
    "  no location is available; this is not an accessibility violation.",
    "* Client-side rendered pages may not be fully indexed by search crawlers.",
    "  For pet detail pages, consider a prerender edge function or SSR for OG preview",
    "  images. See issue #793.",
    "",
  );

  return lines.join("\n");
}

async function main() {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    const page = await context.newPage();

    const results: RouteResult[] = [];
    for (const route of ROUTES) {
      process.stdout.write(`Auditing ${route.path} … `);
      const result = await auditRoute(page, route);
      results.push(result);
      const summary = result.error
        ? "error"
        : `${result.total} violation(s)`;
      process.stdout.write(`${summary}\n`);
    }

    const report = formatReport(results, new Date().toISOString());
    const outPath = path.join(import.meta.dirname, "..", "docs", "a11y-audit.md");
    fs.writeFileSync(outPath, report, "utf8");
    console.log(`\nReport written to docs/a11y-audit.md`);
  } finally {
    await context?.close();
    await browser?.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
