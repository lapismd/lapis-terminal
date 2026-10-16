import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { checkRelease, pendingChangesets } from "./release-state.mjs";
import { prepareVersion, synchronizeVersion } from "./changeset-version.mjs";
const root = process.cwd();
const current = checkRelease();
const next = current.replace(/\d+$/, (patch) => String(Number(patch) + 1));
function fixture(t) {
  mkdirSync(".local", { recursive: true });
  const dir = mkdtempSync(resolve(".local/release-test-"));
  for (const file of [
    "spec-validator.config.mjs",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "Cargo.toml",
    "Cargo.lock",
    ".changeset",
    "spec",
    "scripts",
    "crates",
    "packages",
    "examples",
    ".prettierrc.json",
    ".prettierignore",
  ])
    cpSync(file, join(dir, file), {
      recursive: true,
      filter: (path) =>
        !/(?:^|\/)(?:node_modules|target|dist|book|gen|\.svelte-kit)(?:\/|$)/.test(
          path,
        ),
    });
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"), "dir");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const edit = (root, path, change) =>
  writeFileSync(
    join(root, path),
    change(readFileSync(join(root, path), "utf8")),
  );
test("release state rejects a stale lockfile and an unknown changeset package", async (t) => {
  const dir = fixture(t);
  assert.equal(checkRelease(dir), current);
  edit(dir, "Cargo.lock", (source) =>
    source.replace(
      `name = "lapis-terminal-runtime"\nversion = "${current}"`,
      'name = "lapis-terminal-runtime"\nversion = "0.9.0"',
    ),
  );
  assert.throws(() => checkRelease(dir), /stale Cargo lock/);
  writeFileSync(
    join(dir, ".changeset/invalid.md"),
    '---\n"@lapismd/terminal-demo": patch\n---\nInvalid target.\n',
  );
  await assert.rejects(pendingChangesets(dir), /must target/);
});
test("version synchronization refuses same or older versions", (t) => {
  const dir = fixture(t);
  assert.throws(() => synchronizeVersion(dir, current), /newer/);
  assert.throws(() => synchronizeVersion(dir, "0.0.0"), /newer/);
});
test("real Changesets preparation keeps archives, locks, formatting and spec-first coordinated", async (t) => {
  const dir = fixture(t);
  const before = readFileSync(
    join(dir, "spec/src/history/2026-10-16-qualification.md"),
    "utf8",
  );
  for (const note of await pendingChangesets(dir))
    rmSync(join(dir, `.changeset/${note.id}.md`));
  writeFileSync(
    join(dir, ".changeset/version-test.md"),
    '---\n"@lapismd/terminal": patch\n---\nPrepare disposable test version.\n',
  );
  const result = await prepareVersion(dir);
  assert.deepEqual(result, { changed: true, version: next });
  assert.equal(checkRelease(dir), next);
  assert.equal((await pendingChangesets(dir)).length, 0);
  assert.match(
    readFileSync(join(dir, "packages/terminal/CHANGELOG.md"), "utf8"),
    new RegExp(next.replaceAll(".", "\\.")),
  );
  assert.equal(
    readFileSync(
      join(dir, "spec/src/history/2026-10-16-qualification.md"),
      "utf8",
    ),
    before,
  );
  assert.equal((await prepareVersion(dir)).changed, false);
  execFileSync(
    "pnpm",
    [
      "exec",
      "prettier",
      "--check",
      ".changeset",
      "package.json",
      "packages/terminal/package.json",
      "packages/terminal/CHANGELOG.md",
      "examples/desktop/package.json",
      "examples/desktop/src-tauri/tauri.conf.json",
      "spec/src/current/contracts/release.md",
      "spec/src/SUMMARY.md",
      `spec/src/history/releases/${next}.md`,
    ],
    { cwd: dir, stdio: "inherit" },
  );
  const changed = [
    "Cargo.toml",
    "Cargo.lock",
    "package.json",
    "pnpm-lock.yaml",
    "packages/terminal/package.json",
    "packages/terminal/CHANGELOG.md",
    "examples/desktop/package.json",
    "examples/desktop/src-tauri/Cargo.toml",
    "examples/desktop/src-tauri/tauri.conf.json",
    ".changeset/terminal-foundation.md",
    ...[
      "lapis-terminal-engine",
      "lapis-terminal-runtime",
      "tauri-plugin-lapis-terminal",
    ].map((name) => `crates/${name}/Cargo.toml`),
    "spec/src/current/contracts/release.md",
    `spec/src/history/releases/${next}.md`,
    "spec/src/SUMMARY.md",
  ];
  const command = [
    "exec",
    "spec-validator",
    "first",
    ...changed.flatMap((path) => ["--file", path]),
  ];
  execFileSync("pnpm", command, { cwd: dir, stdio: "inherit" });
  assert.throws(() =>
    execFileSync(
      "pnpm",
      [...command, "--file", "packages/terminal/src/index.ts"],
      { cwd: dir, stdio: "pipe" },
    ),
  );
});
