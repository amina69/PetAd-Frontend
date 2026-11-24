import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "msw-storybook-addon",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    const isPwaPlugin = (plugin: (typeof config.plugins)[number]): boolean => {
      if (Array.isArray(plugin)) return plugin.some(isPwaPlugin);
      return (
        typeof plugin === "object" &&
        plugin !== null &&
        "name" in plugin &&
        typeof plugin.name === "string" &&
        plugin.name.includes("vite-plugin-pwa")
      );
    };

    config.plugins = config.plugins?.filter((plugin) => !isPwaPlugin(plugin));
    return config;
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
