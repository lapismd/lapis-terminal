<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within, waitFor } from "storybook/test";
  import ShellStory from "./ShellStory.svelte";
  const { Story } = defineMeta({
    title: "Terminal/Application shells",
    component: ShellStory,
    tags: ["visual-pending"],
    parameters: {
      docs: {
        description: {
          component:
            "Minimal application examples using released Design Core components. Both embed the public terminal viewport; the host owns the session and layout. Terminal output is fixture data.",
        },
      },
    },
  });
  async function ready(canvasElement: HTMLElement) {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Project terminal output" }),
      ).toHaveTextContent("10 tests passed"),
    );
    const surface = canvasElement.querySelector(
      ".shell-terminal-view .lt-viewport",
    )!;
    const bitmap = surface.querySelector("canvas")!;
    await waitFor(() => {
      expect(bitmap.getBoundingClientRect().width).toBeCloseTo(
        surface.getBoundingClientRect().width,
        0,
      );
      expect(bitmap.getBoundingClientRect().height).toBeCloseTo(
        surface.getBoundingClientRect().height,
        0,
      );
    });
    return canvas;
  }
</script>

<Story
  name="App Shell"
  args={{ kind: "app-shell" }}
  play={async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const id = canvasElement
      .querySelector("[data-session-id]")
      ?.getAttribute("data-session-id");
    expect(
      canvas.getByRole("navigation", { name: "Repository files" }),
    ).toBeVisible();
    expect(
      canvasElement.querySelector(
        '[data-ui-component="app-shell"][data-ui-part="main"]',
      ),
    ).not.toBeNull();
    const toggle = canvas.getByRole("button", { name: "Hide terminal" });
    expect(toggle.closest('[data-ui-part="topbar"]')).not.toBeNull();
    expect(toggle.querySelector('[data-side="bottom"]')).not.toBeNull();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      canvas.queryByRole("textbox", { name: "Project terminal input" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show terminal" }),
    );
    await ready(canvasElement);
    expect(canvasElement.querySelector("[data-session-id]")).toHaveAttribute(
      "data-session-id",
      id,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Maximize terminal" }),
    );
    expect(
      canvas.queryByRole("main", { name: "Repository document" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Restore terminal" }),
    );
    expect(
      canvas.getByRole("main", { name: "Repository document" }),
    ).toBeVisible();
  }}
/>
<Story
  name="Workspace"
  args={{ kind: "workspace" }}
  play={async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const id = canvasElement
      .querySelector("[data-session-id]")
      ?.getAttribute("data-session-id");
    expect(
      canvas.queryByRole("navigation", { name: "Vault files" }),
    ).toBeNull();
    expect(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull(),
    );
    const panel = canvas.getByRole("complementary", { name: "Bottom panel" });
    expect(panel).toContainElement(
      canvasElement.querySelector("[data-session-id]"),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "Session notes" }));
    await waitFor(() =>
      expect(
        canvas.queryByRole("textbox", { name: "Project terminal input" }),
      ).toBeNull(),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "Terminal" }));
    await ready(canvasElement);
    await userEvent.click(
      within(panel).getByRole("button", { name: "Close bottom panel" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("complementary", { name: "Bottom panel" }),
      ).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open bottom panel" }),
    );
    await ready(canvasElement);
    expect(canvasElement.querySelector("[data-session-id]")).toHaveAttribute(
      "data-session-id",
      id,
    );
  }}
/>
