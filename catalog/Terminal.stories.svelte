<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within, waitFor } from "storybook/test";
  import { inputChecks } from "./input-checks.js";
  import { colorChecks } from "./color-checks.js";
  import { compositionControls, narrowFrame } from "./composition-checks.js";
  import TerminalStory from "./TerminalStory.svelte";
  const { Story } = defineMeta({
    title: "Terminal/Compositions",
    component: TerminalStory,
    tags: ["visual-pending"],
  });
  async function output(canvasElement: HTMLElement) {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Shell 1 output" }),
      ).toHaveTextContent("Lapis Terminal"),
    );
    expectBodyStart(canvasElement);
    return canvas;
  }
  function expectBodyStart(canvasElement: HTMLElement) {
    const body = within(canvasElement).getByRole("main", {
      name: "Terminal example",
    });
    const terminal = canvasElement.querySelector("canvas")!;
    expect(
      terminal.getBoundingClientRect().top - body.getBoundingClientRect().top,
    ).toBeLessThanOrEqual(16);
  }
</script>

<Story
  name="Bottom dock"
  args={{ layout: "dock" }}
  play={async ({ canvasElement }) => {
    const canvas = await output(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Hide terminals" }),
    );
    expect(canvas.queryByRole("textbox", { name: "Shell 1 input" })).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show terminals" }),
    );
    await output(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Maximize" }));
    expect(canvas.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  }}
/>
<Story
  name="Workspace panes"
  args={{ layout: "panes" }}
  play={async ({ canvasElement }) => {
    const canvas = await output(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New terminal" }));
    await waitFor(() =>
      expect(canvas.getAllByRole("textbox", { name: /output$/ })).toHaveLength(
        2,
      ),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Close shell 2" }),
    );
    await waitFor(() =>
      expect(canvas.getAllByRole("textbox", { name: /output$/ })).toHaveLength(
        1,
      ),
    );
  }}
/>
<Story
  name="Bare viewport"
  args={{ layout: "bare" }}
  play={async ({ canvasElement }) => {
    await output(canvasElement);
  }}
/>
<Story
  name="Narrow container"
  args={{ compact: true }}
  play={async ({ canvasElement }) => {
    await output(canvasElement);
    narrowFrame(canvasElement);
    await compositionControls(canvasElement);
  }}
/>
<Story
  name="Input and Unicode"
  play={async ({ canvasElement }) => {
    const canvas = await output(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Shell 1 input" });
    await userEvent.type(input, "echo");
    expect(
      canvas.getByRole("textbox", { name: "Shell 1 output" }),
    ).toHaveTextContent("你好");
  }}
/>
<Story
  name="Colored output"
  play={async ({ canvasElement }) => {
    await output(canvasElement);
    await colorChecks(canvasElement);
  }}
/>
<Story
  name="Exited session"
  args={{ scenario: "exited" }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Shell 1 input" }),
      ).toBeDisabled(),
    );
  }}
/>
<Story
  name="High output"
  args={{ scenario: "high-output" }}
  play={async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole("textbox", { name: "Shell 1 output" }),
      ).toHaveTextContent("build step 1:"),
    );
    expectBodyStart(canvasElement);
  }}
/>
<Story
  name="Recoverable error"
  args={{ scenario: "error" }}
  play={async ({ canvasElement }) => {
    const canvas = await output(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Shell 1 input" }),
      "x",
    );
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent(
        "temporarily unavailable",
      ),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    expect(canvas.queryByRole("alert")).toBeNull();
  }}
/>

<Story
  name="IME paste and copy"
  args={{ scenario: "input" }}
  play={async ({ canvasElement }) => {
    await output(canvasElement);
    await inputChecks(canvasElement);
  }}
/>
