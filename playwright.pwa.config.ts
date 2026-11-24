import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "pwa-cache.spec.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4322",
    serviceWorkers: "allow",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4322 --strictPort",
    url: "http://127.0.0.1:4322/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
