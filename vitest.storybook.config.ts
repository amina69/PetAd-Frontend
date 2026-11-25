import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import viteConfig from "./vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  { ...viteConfig, test: undefined },
  defineConfig({
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-dev-runtime"],
    },
    plugins: [
      storybookTest({
        configDir: path.join(dirname, ".storybook"),
      }),
    ],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        provider: playwright({}),
        headless: true,
        instances: [{ browser: "chromium" }],
      },
      deps: {
        optimizer: {
          web: {
            include: ["react", "react-dom", "react/jsx-dev-runtime"],
          },
        },
      },
    },
  }),
);
