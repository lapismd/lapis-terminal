export function encodeTerminalKey(event: {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}): string | null {
  if (event.metaKey) return null;
  const special: Readonly<Record<string, string>> = {
    Enter: "\r",
    Backspace: "\u007f",
    Tab: "\t",
    Escape: "\u001b",
    ArrowUp: "\u001b[A",
    ArrowDown: "\u001b[B",
    ArrowRight: "\u001b[C",
    ArrowLeft: "\u001b[D",
    Home: "\u001b[H",
    End: "\u001b[F",
    Delete: "\u001b[3~",
    PageUp: "\u001b[5~",
    PageDown: "\u001b[6~",
  };
  const specialValue = special[event.key];
  if (specialValue) return `${event.altKey ? "\u001b" : ""}${specialValue}`;
  if (event.ctrlKey && event.key.length === 1) {
    const code = event.key.toUpperCase().charCodeAt(0);
    if (code >= 64 && code <= 95) return String.fromCharCode(code - 64);
  }
  if (event.altKey && event.key.length === 1) return `\u001b${event.key}`;
  return null;
}

export function encodePaste(text: string, bracketed: boolean): string {
  return bracketed ? `\u001b[200~${text}\u001b[201~` : text;
}

export type ScrollAccumulator = { remainderPx: number };

/** Preserve sub-cell trackpad movement instead of truncating every event. */
export function accumulateScrollLines(
  state: ScrollAccumulator,
  deltaPx: number,
  cellHeight: number,
): { state: ScrollAccumulator; lines: number } {
  if (!(cellHeight > 0) || !Number.isFinite(deltaPx)) {
    return { state, lines: 0 };
  }
  const total = state.remainderPx + deltaPx;
  const lines = Math.trunc(total / cellHeight);
  return {
    state: { remainderPx: total - lines * cellHeight },
    lines,
  };
}
