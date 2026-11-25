import type { Preview } from "@storybook/react-vite";
import { mswLoader } from "msw-storybook-addon/csf3";
import { ThemeProvider } from "../src/components/theme-provider";
import "../src/index.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light" storageKey="storybook-theme">
        <main>
          <h1 className="sr-only">PetAd primitive preview</h1>
          <h2 className="sr-only">Component example</h2>
          <Story />
        </main>
      </ThemeProvider>
    ),
  ],
  loaders: [
    mswLoader(async () => {
      const { setupWorker } = await import("msw/browser");
      const worker = setupWorker();
      await worker.start({ onUnhandledRequest: "bypass" });
      return worker;
    }),
  ],
  parameters: {
    a11y: {
      test: "error",
    },
    viewport: {
      options: {
        mobile375: {
          name: "Mobile 375",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
        tablet768: {
          name: "Tablet 768",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop1280: {
          name: "Desktop 1280",
          styles: { width: "1280px", height: "900px" },
          type: "desktop",
        },
      },
      defaultViewport: "desktop1280",
    },
  },
};

export default preview;
