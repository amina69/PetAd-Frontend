// vite.config.ts
import { defineConfig, type UserConfig } from 'vite'
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vitest configuration
const vitestConfig = {
  globals: true,                   // allows describe/it/expect without imports
  environment: 'jsdom',            // DOM environment for React
  setupFiles: './vitest.setup.ts', // setup file for jest-dom
  include: ['src/**/*.{test,spec}.{ts,tsx}'], // test files
}

// Export Vite config
export default defineConfig({
  // server: {
  //     host: "::",
  //     port: 5173,
  //     open: true,
  //   },
  plugins: [react(), tailwindcss()],
  test: vitestConfig,
} as UserConfig)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
})
