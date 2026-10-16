import type { FrameMessage } from "../protocol.js";
import type { TerminalViewport } from "../renderer.js";
/** Deterministic display fixture, not an ANSI emulator. */
export function fixtureFrame(
  lines: readonly string[],
  viewport: TerminalViewport,
  subscriptionId: string,
  sequence: number,
): FrameMessage {
  return {
    subscriptionId,
    sequence,
    viewport,
    full: true,
    bracketedPaste: true,
    focusReporting: false,
    cursor: {
      line: Math.min(lines.length, viewport.screenLines - 1),
      column: 0,
      visible: true,
    },
    rows: Array.from({ length: viewport.screenLines }, (_, line) => {
      let column = 0;
      const clusters = [];
      for (const { segment } of new Intl.Segmenter(undefined, {
        granularity: "grapheme",
      }).segment(lines[line] ?? "")) {
        const width: 1 | 2 = /\p{Extended_Pictographic}|[\u2e80-\ua4cf]/u.test(
          segment,
        )
          ? 2
          : 1;
        if (column + width > viewport.columns) break;
        clusters.push({ column, text: segment, width });
        column += width;
      }
      return {
        line,
        wrapped: false,
        spans: [{ style: { fg: 0, bg: 0, flags: 0 }, clusters }],
      };
    }),
  };
}
