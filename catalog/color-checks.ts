import { expect, within, waitFor } from "storybook/test";
import { terminalPalette } from "@lapismd/terminal";

/** Check painted glyph pixels, not only the fixture's style metadata. */
export async function colorChecks(element: HTMLElement) {
  const output = within(element).getByRole("textbox", {
    name: "Shell 1 output",
  });
  expect(output).toHaveTextContent("PASS 10 tests passed");
  expect(output).toHaveTextContent("WARN Example warning");
  expect(output).toHaveTextContent("FAIL Example failure");
  const palette = terminalPalette(
    element.ownerDocument.documentElement.classList.contains("dark"),
  );
  const bitmap = element.querySelector("canvas")!;
  await waitFor(() => {
    const pixels = bitmap
      .getContext("2d")!
      .getImageData(0, 0, bitmap.width, bitmap.height).data;
    const colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 255)
        colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
    }
    for (const color of [
      palette.ansi.green,
      palette.ansi.yellow,
      palette.ansi.red,
      palette.ansi.cyan,
    ]) {
      expect(colors.has(Number.parseInt(color.slice(1), 16))).toBe(true);
    }
  });
}
