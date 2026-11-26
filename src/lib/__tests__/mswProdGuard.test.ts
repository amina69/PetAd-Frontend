/// <reference types="node" />
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	assertBundleHasNoMsw,
	assertProductionMswDisabled,
} from "../../../scripts/msw-prod-guard.mjs";

describe("production MSW guard", () => {
	it("fails a deliberately misconfigured production environment", () => {
		expect(() => assertProductionMswDisabled("production", "true")).toThrow(
			/VITE_MSW=true/,
		);
		expect(() => assertProductionMswDisabled("production", "false")).not.toThrow();
		expect(() => assertProductionMswDisabled("development", "true")).not.toThrow();
	});

	it("fails when a production bundle contains msw", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "petad-msw-"));
		fs.writeFileSync(path.join(dir, "app.js"), "vendor chunk");
		expect(() => assertBundleHasNoMsw(dir)).not.toThrow();

		fs.writeFileSync(path.join(dir, "leak.js"), "import { setupWorker } from 'msw';");
		expect(() => assertBundleHasNoMsw(dir)).toThrow(/MSW leaked/);
	});
});
