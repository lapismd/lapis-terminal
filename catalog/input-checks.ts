import { expect, within, waitFor } from "storybook/test";
/** Browser events exercise the public component rather than calling its controller. */
export async function inputChecks(element: HTMLElement) {
  const canvas = within(element);
  const input = canvas.getByRole("textbox", {
    name: "Shell 1 input",
  }) as HTMLTextAreaElement;
  input.focus();
  input.dispatchEvent(
    new CompositionEvent("compositionstart", { bubbles: true }),
  );
  input.value = "日本語";
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, isComposing: true }),
  );
  expect(canvas.getByLabelText("Sent input")).toHaveTextContent("[]");
  input.dispatchEvent(
    new CompositionEvent("compositionend", { bubbles: true, data: "日本語" }),
  );
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, isComposing: false }),
  );
  await waitFor(() =>
    expect(canvas.getByLabelText("Sent input")).toHaveTextContent('["日本語"]'),
  );
  const clipboard = new DataTransfer();
  clipboard.setData("text/plain", "paste payload");
  input.dispatchEvent(
    new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboard,
    }),
  );
  await waitFor(() =>
    expect(canvas.getByLabelText("Sent input")).toHaveTextContent(
      "\\u001b[200~paste payload\\u001b[201~",
    ),
  );
  const row = element.querySelector('[data-terminal-row="0"]')!;
  const range = document.createRange();
  range.setStart(row.firstChild!, 0);
  range.setEnd(row.firstChild!, 5);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  const copied = new DataTransfer();
  document.dispatchEvent(
    new ClipboardEvent("copy", {
      bubbles: true,
      cancelable: true,
      clipboardData: copied,
    }),
  );
  expect(copied.getData("text/plain")).toBe("Lapis");
  selection.removeAllRanges();
  const before = element.querySelector("canvas")!.height;
  const slider = canvas.getByRole("slider", {
    name: "Panel height",
  }) as HTMLInputElement;
  slider.value = "420";
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  await waitFor(() =>
    expect(element.querySelector("canvas")!.height).toBeGreaterThan(before),
  );
}
