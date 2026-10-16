import type { TerminalGrid } from "./renderer.js";
/** Copy only the user's selected cells, preserving wide/combined glyph boundaries. */
export function copyTerminalSelection(
  event: ClipboardEvent,
  grid: TerminalGrid | undefined,
  root: HTMLElement,
) {
  const selection = window.getSelection();
  if (!grid || !selection || selection.isCollapsed || !event.clipboardData)
    return;
  const rowFor = (node: Node | null) =>
    (node?.nodeType === 1
      ? (node as Element)
      : node?.parentElement
    )?.closest<HTMLElement>("[data-terminal-row]");
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if (!anchor || !focus) return;
  let start = rowFor(anchor);
  let end = rowFor(focus);
  if (!start || !end || !root.contains(start) || !root.contains(end)) return;
  let first = Number(start.dataset.terminalRow);
  let last = Number(end.dataset.terminalRow);
  const offset = (row: HTMLElement, node: Node, position: number) => {
    const range = document.createRange();
    range.selectNodeContents(row);
    range.setEnd(node, position);
    return range.toString().length;
  };
  let from = offset(start, anchor, selection.anchorOffset);
  let to = offset(end, focus, selection.focusOffset);
  if (first > last || (first === last && from > to)) {
    [first, last] = [last, first];
    [from, to] = [to, from];
    [start, end] = [end, start];
  }
  from = grid.normalizeSelectionOffset(first, from, "start");
  to = grid.normalizeSelectionOffset(last, to, "end");
  event.preventDefault();
  event.clipboardData.setData(
    "text/plain",
    grid.selectionText(first, from, last, to),
  );
}
