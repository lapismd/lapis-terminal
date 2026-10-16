import type { Preview } from "@storybook/svelte";
export default {
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  tags: ["autodocs"],
} satisfies Preview;
