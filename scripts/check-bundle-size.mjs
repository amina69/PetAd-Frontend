import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const dist = join(root, "dist");
const manifestPath = join(dist, ".vite", "manifest.json");
const budget = Number(process.env.INITIAL_JS_BUDGET_KB ?? 350) * 1024;
const reportOnly = process.argv.includes("--report-only");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const jsFiles = new Set();
const visit = (entry) => {
  if (!entry || jsFiles.has(entry.file)) return;
  if (entry.file.endsWith(".js")) jsFiles.add(entry.file);
  for (const imported of entry.imports ?? []) visit(manifest[imported]);
};

for (const entry of Object.values(manifest)) {
  if (entry.isEntry) visit(entry);
}

const initial = await Promise.all(
  [...jsFiles].map(async (file) => {
    const bytes = (await readFile(join(dist, file))).length;
    return { file, bytes, gzip: gzipSync(await readFile(join(dist, file))).length };
  }),
);
const initialGzip = initial.reduce((sum, file) => sum + file.gzip, 0);
const assets = await readdir(join(dist, "assets"));
const largest = await Promise.all(
  assets
    .filter((file) => file.endsWith(".js"))
    .map(async (file) => {
      const bytes = (await readFile(join(dist, "assets", file))).length;
      return { file, bytes, gzip: gzipSync(await readFile(join(dist, "assets", file))).length };
    }),
);

console.log(`Initial JavaScript: ${(initialGzip / 1024).toFixed(1)} KiB gzipped (budget ${(budget / 1024).toFixed(0)} KiB)`);
console.log("Largest JavaScript assets:");
for (const asset of largest.sort((a, b) => b.gzip - a.gzip).slice(0, 10)) {
  console.log(`  ${(asset.gzip / 1024).toFixed(1).padStart(7)} KiB gzip  ${(asset.bytes / 1024).toFixed(1).padStart(7)} KiB raw  ${asset.file}`);
}

if (!reportOnly && initialGzip > budget) {
  console.error("Initial JavaScript exceeds the configured budget.");
  process.exit(1);
}
