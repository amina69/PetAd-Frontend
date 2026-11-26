import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const allowed = new Set([path.normalize(path.join(root, "lib", "queryKeys.ts"))]);
const literal =
	/(?:^|[^A-Za-z0-9_$])\[\s*["'](?:shelterApprovals|adminApprovals|escrow-timeline|custody-timeline|custody-details|notifications|notificationPreferences|notification-count|documents|adoption|approvals|timeline|disputes|dispute-count|pets|adoptions|escrow)["']/;
const queryUse = /queryKey|setQueryData|getQueryData|invalidates|usePolling|useApiQuery/;

function walk(dir, hits) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full, hits);
			continue;
		}
		if (!/\.(ts|tsx)$/.test(entry.name)) continue;
		if (allowed.has(path.normalize(full))) continue;
		const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
		lines.forEach((line, index) => {
			const code = line.replace(/\/\/.*$/, "");
			const previous = index > 0 ? lines[index - 1] : "";
			if (literal.test(code) && queryUse.test(`${previous}\n${code}`)) {
				hits.push(`${path.relative(process.cwd(), full)}:${index + 1}: ${line.trim()}`);
			}
		});
	}
}

const hits = [];
walk(root, hits);
if (hits.length > 0) {
	console.error("String-literal query keys found outside src/lib/queryKeys.ts:");
	for (const hit of hits) console.error(hit);
	process.exit(1);
}
console.log("Query keys are factory-only.");
