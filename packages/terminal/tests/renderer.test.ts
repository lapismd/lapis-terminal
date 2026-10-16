import { test } from "node:test";
import assert from "node:assert/strict";
import { TerminalGrid } from "../src/renderer.js";
import { fixtureFrame } from "../src/testing/index.js";
import {
  encodePaste,
  encodeTerminalKey,
  accumulateScrollLines,
} from "../src/keyboard.js";
test("grapheme-aware selection and generation fencing", () => {
  const view = { generation: 2, columns: 30, screenLines: 3 };
  const grid = new TerminalGrid(view);
  assert.equal(grid.apply(fixtureFrame(["你好 café 👩🏽‍💻"], view, "a", 1)), true);
  assert.match(grid.text(), /你好 café 👩🏽‍💻/);
  const row = grid.selectionRows()[0];
  const emoji = row.text.indexOf("👩");
  assert.equal(grid.normalizeSelectionOffset(0, emoji + 1, "start"), emoji);
  assert.equal(
    grid.normalizeSelectionOffset(0, emoji + 1, "end"),
    row.text.length,
  );
  assert.equal(
    grid.apply(fixtureFrame(["old"], { ...view, generation: 1 }, "a", 2)),
    false,
  );
  assert.doesNotMatch(grid.text(), /old/);
});
test("keyboard control keys, bracketed paste and fractional scrolling", () => {
  assert.equal(
    encodeTerminalKey({
      key: "c",
      ctrlKey: true,
      altKey: false,
      metaKey: false,
    }),
    "\x03",
  );
  assert.equal(
    encodeTerminalKey({
      key: "c",
      ctrlKey: false,
      altKey: false,
      metaKey: true,
    }),
    null,
  );
  assert.equal(encodePaste("你好", true), "\x1b[200~你好\x1b[201~");
  const a = accumulateScrollLines({ remainderPx: 0 }, 8, 17);
  const b = accumulateScrollLines(a.state, 10, 17);
  assert.equal(a.lines, 0);
  assert.equal(b.lines, 1);
  assert.equal(b.state.remainderPx, 1);
});

test("Rust-produced wire fixture is consumable without field remapping", async () => {
  const { readFile } = await import("node:fs/promises");
  const { payload: frame } = JSON.parse(
    await readFile(
      new URL(
        "../../../crates/lapis-terminal-runtime/tests/fixtures/frame.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const grid = new TerminalGrid(frame.viewport);
  assert.equal(grid.apply(frame), true);
  assert.equal(grid.selectionRows()[0].text, "界");
  assert.equal(frame.bracketedPaste, true);
  assert.equal(frame.viewport.screenLines, 24);
});
