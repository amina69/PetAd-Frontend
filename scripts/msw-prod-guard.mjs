import fs from "node:fs";
import path from "node:path";

export function assertProductionMswDisabled(mode, viteMsw) {
	if (mode === "production" && viteMsw === "true") {
		throw new Error(
			"VITE_MSW=true is not allowed in a production environment",
		);
	}
}

// What MSW leaves in a bundle: its setup API or an import of the package. The worker file name is checked by
// file name only: main.tsx names /mockServiceWorker.js on purpose to unregister a stale registration.
const MSW_MARKER = /setupWorker\(|from\s*["']msw["']|msw\/browser/;

export function findMswLeaks(dir) {
	const hits = [];
	if (!fs.existsSync(dir)) return hits;

	function walk(current) {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				walk(full);
				continue;
			}
			if (/^mockServiceWorker/i.test(entry.name)) {
				hits.push(full);
				continue;
			}
			// Only scan text assets; binary files (images, fonts) can contain any byte sequence.
			if (!/\.(m?js|cjs|css|html)$/i.test(entry.name)) continue;
			const text = fs.readFileSync(full);
			const sample = text.subarray(0, Math.min(text.length, 4_000_000)).toString("utf8");
			if (MSW_MARKER.test(sample)) {
				hits.push(full);
			}
		}
	}

	walk(dir);
	return hits;
}

export function assertBundleHasNoMsw(dir) {
	const hits = findMswLeaks(dir);
	if (hits.length > 0) {
		throw new Error(
			`MSW leaked into the production bundle:\n${hits.join("\n")}`,
		);
	}
}
