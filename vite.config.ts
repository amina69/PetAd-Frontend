import { rmSync } from "node:fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

// Source maps are uploaded to the error tracker during the CI release build and
// then deleted, so the release id must match the one the app reports at runtime
// (see src/lib/errorTracking.ts). Issue 779.
const sentryRelease = process.env.VITE_RELEASE?.trim();
const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();
const sentryUploadEnabled = Boolean(
  sentryAuthToken && sentryOrg && sentryProject && sentryRelease,
);

// MSW is dev/test-only: main.tsx guards the worker import behind DEV && VITE_MSW ===
// 'true' so the bundler tree-shakes src/mocks/** out of production. Keep MSW out of
// manualChunks and omit public/mockServiceWorker.js from dist so `grep -r "msw" dist/`
// stays clean; see issue #525.
const mswPlugin = (): Plugin => ({
  name: "omit-msw-service-worker",
  apply: "build",
  writeBundle() {
    try {
      rmSync("dist/mockServiceWorker.js");
    } catch {
      // dist/mockServiceWorker.js is not present (never copied / already removed).
    }
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 4321,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 4321,
      protocol: "ws",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    mswPlugin(),
    // Hidden source maps are generated for every build; the plugin uploads them
    // to Sentry under the git-SHA release and deletes them afterwards so the
    // deployed artifact never contains .map files. Without CI credentials it is
    // skipped, and the release workflow strips any remaining maps before deploy.
    ...(sentryUploadEnabled
      ? [
          sentryVitePlugin({
            org: sentryOrg,
            project: sentryProject,
            authToken: sentryAuthToken,
            release: { name: sentryRelease },
            sourcemaps: {
              filesToDeleteAfterUpload: "./dist/**/*.map",
            },
            telemetry: false,
          }),
        ]
      : []),
    ...(mode === "analyze"
      ? [
          visualizer({
            filename: "dist/bundle-stats.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  build: {
    // "hidden" emits .map files without sourceMappingURL comments. They are
    // uploaded to the tracker in CI and removed from the deployed artifact.
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'react-hot-toast']
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/mocks/**",
        "src/**/*.d.ts",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
        "src/features/**": {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },
}));
