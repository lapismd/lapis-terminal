import {
  ANSI_COLOR_NAMES,
  type AnsiColorName,
  type TerminalPalette,
} from "./palette.js";
const COLOR_KIND = 0xff00_0000;
const COLOR_VALUE = 0x00ff_ffff;
const NAMED = 0x0100_0000;
const INDEXED = 0x0200_0000;
const RGB = 0x0300_0000;

function xtermIndexed(index: number, palette: TerminalPalette): string {
  if (index < 16) return palette.ansi[ANSI_COLOR_NAMES[index]];
  if (index < 232) {
    const offset = index - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    const r = levels[Math.floor(offset / 36)];
    const g = levels[Math.floor((offset % 36) / 6)];
    const b = levels[offset % 6];
    return `rgb(${r} ${g} ${b})`;
  }
  const gray = 8 + (index - 232) * 10;
  return `rgb(${gray} ${gray} ${gray})`;
}

export function resolvePackedColor(
  packed: number,
  palette: TerminalPalette,
  fallback: "foreground" | "background",
): string {
  const kind = packed & COLOR_KIND;
  const value = packed & COLOR_VALUE;
  if (kind === RGB) {
    return `#${value.toString(16).padStart(6, "0")}`;
  }
  if (kind === INDEXED) return xtermIndexed(value & 0xff, palette);
  if (kind === NAMED) {
    if (value < 16) return palette.ansi[ANSI_COLOR_NAMES[value]];
    if (value === 256 || value === 272) return palette.foreground;
    if (value === 257) return palette.background;
    if (value === 258) return palette.cursor;
    if (value >= 259 && value <= 266) {
      return palette.ansi[ANSI_COLOR_NAMES[value - 259] as AnsiColorName];
    }
    if (value === 271) return palette.ansi.brightWhite;
  }
  return palette[fallback];
}
