import { rmSync } from "node:fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

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
  },
}));
