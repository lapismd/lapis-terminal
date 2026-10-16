import { expect, userEvent, waitFor, within } from "storybook/test";

export async function compositionControls(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const target = canvas.getByRole("button", { name: /^Target:/ });
  expect(target.tagName).toBe("BUTTON");
  expect(target).toHaveAttribute("aria-haspopup", "listbox");
  await userEvent.click(target);
  const page = within(canvasElement.ownerDocument.body);
  await userEvent.click(await page.findByRole("option"));
  await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
  for (const name of ["New terminal", "Maximize", "Close shell 1"]) {
    const button = canvas.getByRole("button", { name });
    expect(button.textContent?.trim()).toBe("");
    expect(button.querySelector("svg")).not.toBeNull();
  }
  const tab = canvas.getByRole("button", { name: "Shell 1" });
  const group = tab.parentElement!;
  const background = getComputedStyle(group).backgroundColor;
  expect(background).not.toBe("transparent");
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
  expect(tab).toHaveAttribute("aria-pressed", "true");
}

export function narrowFrame(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<HTMLElement>(
    '[data-ui-component="app-shell"][data-ui-part="root"]',
  )!;
  const main = canvasElement.querySelector<HTMLElement>(
    '[data-ui-component="app-shell"][data-ui-part="main"]',
  )!;
  const outer = root.getBoundingClientRect();
  const frame = main.getBoundingClientRect();
  expect(frame.left - outer.left).toBeGreaterThanOrEqual(7);
  expect(outer.right - frame.right).toBeGreaterThanOrEqual(7);
  expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
  expect(parseFloat(getComputedStyle(main).borderRightWidth)).toBeGreaterThan(
    0,
  );
}
