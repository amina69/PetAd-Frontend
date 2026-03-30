import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // server: {
  //     host: "::",
  //     port: 5173,
  //     open: true,
  //   },
  plugins: [react(), tailwindcss()],
  server: {
    port: 4321,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
