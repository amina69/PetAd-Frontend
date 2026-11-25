import { rmSync } from "node:fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

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
    ...(loadEnv(mode, process.cwd(), "").VITE_MSW === "true"
      ? []
      : [
          VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            injectRegister: false,
            registerType: "prompt",
            devOptions: { enabled: false },
            injectManifest: {
              globPatterns: ["**/*.{html,js,css,ico,png,svg,webp,woff2}"],
              globIgnores: ["**/mockServiceWorker.js"],
            },
            manifest: {
              name: "PetAd",
              short_name: "PetAd",
              description: "Find a loving home for every pet.",
              theme_color: "#ffffff",
              background_color: "#ffffff",
              display: "standalone",
              start_url: "/",
              icons: [
                {
                  src: "/vite.svg",
                  sizes: "any",
                  type: "image/svg+xml",
                  purpose: "any",
                },
              ],
            },
          }),
        ]),
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
    exclude: ["e2e/**", "pwa/**", "node_modules/**", "dist/**"],
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
