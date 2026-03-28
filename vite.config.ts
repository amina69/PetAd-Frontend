// vite.config.ts
import { defineConfig, type UserConfig } from 'vite'
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
  plugins: [react(), tailwindcss()],
  test: vitestConfig,
} as UserConfig)