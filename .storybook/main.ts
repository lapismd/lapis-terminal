import type { StorybookConfig } from "@storybook/svelte-vite";
export default {
  stories: ["../catalog/**/*.stories.svelte"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  core: { disableTelemetry: true },
} satisfies StorybookConfig;
