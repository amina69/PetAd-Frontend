import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * MSW's service worker lives in `public/` so `msw init` can keep managing it
 * for local development (`VITE_MSW=true`) and Playwright. Vite copies the whole
 * `public/` directory into the build output verbatim, which used to ship the
 * worker to production even though the bootstrap guard in `src/main.tsx` makes
 * it impossible to activate there — and left `msw` strings in the bundle.
 *
 * Drop it from the build output; dev/test workflows are untouched.
 */
function omitMswServiceWorker(): Plugin {
  let outDir = "dist";

  return {
    name: "omit-msw-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      rmSync(resolve(outDir, "mockServiceWorker.js"), { force: true });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
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
  plugins: [react(), tailwindcss(), omitMswServiceWorker()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'react-hot-toast']
          // NOTE: do not add an 'msw-vendor' entry here. Object-form
          // manualChunks emits the named chunk in every build whether or not
          // MSW survives tree-shaking, which re-introduces a production
          // artifact named `msw`. MSW must stay reachable only through the
          // guarded dynamic import in src/main.tsx.
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
});
