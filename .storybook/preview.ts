/// <reference types="vite/client" />
import type { Preview } from "@storybook/svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapismd/design-core/workspace/workspace.tokens.css";
const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: "Light or dark appearance for every example",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorMode: import.meta.env.VITE_STORYBOOK_THEME ?? "light",
  },
  decorators: [
    (story, context) => {
      const dark = context.globals.colorMode === "dark";
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.uiTheme = "lapis";
      return story({ args: { ...context.args, dark } });
    },
  ],
  argTypes: { dark: { table: { disable: true } } },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    options: {
      storySort: {
        order: ["Terminal", ["Application shells", "Compositions"]],
      },
    },
  },
  tags: ["autodocs"],
};
export default preview;
