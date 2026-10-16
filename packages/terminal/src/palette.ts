export const ANSI_COLOR_NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;
export type AnsiColorName = (typeof ANSI_COLOR_NAMES)[number];
export type TerminalPalette = {
  background: string;
  foreground: string;
  cursor: string;
  ansi: Record<AnsiColorName, string>;
};
export function terminalPalette(dark = true): TerminalPalette {
  const colors = dark
    ? [
        "#242424",
        "#f97583",
        "#85d996",
        "#e5c07b",
        "#79b8ff",
        "#c998ef",
        "#74d9df",
        "#d1d5db",
        "#737b89",
        "#ff9fa8",
        "#a6ecb1",
        "#ffe39c",
        "#a2d0ff",
        "#e4bcff",
        "#a2f1f4",
        "#ffffff",
      ]
    : [
        "#242424",
        "#a50d24",
        "#166534",
        "#854d0e",
        "#1d4ed8",
        "#7e22ce",
        "#0e6070",
        "#575757",
        "#647080",
        "#be123c",
        "#15803d",
        "#92400e",
        "#2563eb",
        "#9333ea",
        "#0e7490",
        "#000000",
      ];
  return {
    background: dark ? "#10161c" : "#ffffff",
    foreground: dark ? "#e2e8f0" : "#1f2937",
    cursor: dark ? "#e2e8f0" : "#1f2937",
    ansi: Object.fromEntries(
      ANSI_COLOR_NAMES.map((name, i) => [name, colors[i]]),
    ) as Record<AnsiColorName, string>,
  };
}
