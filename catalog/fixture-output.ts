import type { TerminalMessage, TerminalRow } from "@lapismd/terminal";
import { FixtureTransport } from "@lapismd/terminal/testing";

const sampleOutput = [
  "Lapis Terminal",
  "Unicode: café 你好 👩🏽‍💻",
  "$ pnpm test",
  "INFO  Running example checks",
  "PASS  terminal sessions and keyboard input",
  "PASS  10 tests passed",
  "WARN  Example warning: optional cache unavailable",
  "FAIL  Example failure: connection timed out",
  "$ ready",
];
const namedColors: Record<string, number> = {
  "Lapis Terminal": 6,
  $: 5,
  INFO: 6,
  PASS: 2,
  WARN: 3,
  FAIL: 1,
};

function coloredRow(row: TerminalRow): TerminalRow {
  const text = row.spans
    .flatMap((span) => span.clusters.map((c) => c.text))
    .join("");
  const label = Object.keys(namedColors).find(
    (key) => text === key || text.startsWith(`${key} `),
  );
  if (!label) return row;
  return {
    ...row,
    spans: row.spans.flatMap((span) => {
      const prefix = span.clusters.filter(
        (cluster) => cluster.column < label.length,
      );
      const rest = span.clusters.filter(
        (cluster) => cluster.column >= label.length,
      );
      return [
        {
          style: {
            ...span.style,
            fg: 0x0100_0000 | namedColors[label],
            flags: 1,
          },
          clusters: prefix,
        },
        { ...span, clusters: rest },
      ].filter((part) => part.clusters.length > 0);
    }),
  };
}

/** Catalog-only styled frames exercise the real renderer, without parsing ANSI or spawning shells. */
export class CatalogTransport extends FixtureTransport {
  constructor(initial = sampleOutput) {
    super(initial);
  }
  override attach(id: string, receive: (message: TerminalMessage) => void) {
    return super.attach(id, (message) =>
      receive(
        message.type === "frame"
          ? {
              ...message,
              payload: {
                ...message.payload,
                rows: message.payload.rows.map(coloredRow),
              },
            }
          : message,
      ),
    );
  }
}
