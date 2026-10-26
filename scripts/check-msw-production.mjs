#!/usr/bin/env node
/**
 * Production MSW guard.
 *
 * Fails the build when a *production* target resolves `VITE_MSW=true`.
 *
 * The mock service worker must never be enabled in a production bundle: it
 * intercepts real network requests and would silently serve mock data to
 * users. This script resolves `VITE_MSW` the same way Vite does (process.env
 * wins, then `.env.[mode].local`, `.env.[mode]`, `.env.local`, `.env`) and
 * exits non-zero when the resolved value is `true` for a production mode.
 *
 * Usage:
 *   node scripts/check-msw-production.mjs --mode production
 *   node scripts/check-msw-production.mjs            # defaults to production
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/526
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Parse a dotenv-style file into a flat key/value map. */
function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  const out = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);

    out[key] = value;
  }
  return out;
}

const args = process.argv.slice(2);
const modeIndex = args.indexOf("--mode");
const mode =
  modeIndex !== -1 && args[modeIndex + 1]
    ? args[modeIndex + 1]
    : process.env.NODE_ENV === "development"
      ? "development"
      : "production";

const isProductionMode =
  mode === "production" || process.env.NODE_ENV === "production";

// Vite precedence, lowest → highest: .env, .env.local, .env.[mode], .env.[mode].local.
// process.env always wins over file values.
const files = [
  ".env",
  ".env.local",
  `.env.${mode}`,
  `.env.${mode}.local`,
];

const resolvedEnv = {};
for (const file of files) {
  Object.assign(resolvedEnv, parseEnvFile(resolve(process.cwd(), file)));
}
if (process.env.VITE_MSW !== undefined) {
  resolvedEnv.VITE_MSW = process.env.VITE_MSW;
}

const resolvedValue = resolvedEnv.VITE_MSW;

if (isProductionMode && String(resolvedValue).toLowerCase() === "true") {
  console.error(
    [
      "",
      "✖ Refusing to build: VITE_MSW=true for a production target.",
      "",
      "The mock service worker intercepts network requests and must not be",
      "enabled in production. Unset VITE_MSW (or set it to false) in your",
      `resolved "${mode}" environment before building.`,
      "",
      "For local mocking run: VITE_MSW=true npm run dev",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  `✔ VITE_MSW safety check passed (mode="${mode}", VITE_MSW=${resolvedValue ?? "unset"}).`,
);
