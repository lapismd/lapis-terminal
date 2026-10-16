import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
export default defineConfig({
  optimizeDeps: {
    include: ["@lapismd/design-core/shadcn/panel-toggle"],
  },
  plugins: [
    svelte(),
    storybookTest({
      configDir: fileURLToPath(new URL("../.storybook", import.meta.url)),
    }),
  ],
  test: {
    name: "storybook",
    setupFiles: [".storybook/vitest.setup.ts"],
    testTimeout: 30000,
    browser: {
      enabled: true,
      headless: true,
      fileParallelism: false,
      provider: playwright({ contextOptions: { deviceScaleFactor: 2 } }),
      instances: [
        { browser: "chromium", viewport: { width: 1200, height: 900 } },
      ],
    },
  },
});
