import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import TOML from "@iarna/toml";
import {
  crates,
  read,
  json,
  manifest,
  checkRelease,
  pendingChangesets,
} from "./release-state.mjs";
export function synchronizeVersion(root, selected) {
  const previous = manifest(root, "Cargo.toml").workspace.package.version;
  if (!/^\d+\.\d+\.\d+$/.test(selected)) throw Error("stable version required");
  const before = previous.split(".").map(Number),
    after = selected.split(".").map(Number);
  const changed = after.findIndex((value, index) => value !== before[index]);
  if (changed < 0 || after[changed] < before[changed])
    throw Error("newer version required");
  const save = (path, value) => writeFileSync(join(root, path), value);
  const workspace = manifest(root, "Cargo.toml");
  workspace.workspace.package.version = selected;
  save("Cargo.toml", TOML.stringify(workspace));
  for (const path of [
    ...crates.map((name) => `crates/${name}/Cargo.toml`),
    "examples/desktop/src-tauri/Cargo.toml",
  ]) {
    const cargo = manifest(root, path);
    for (const [name, value] of Object.entries(cargo.dependencies ?? {}))
      if (crates.includes(name)) value.version = selected;
    save(path, TOML.stringify(cargo));
  }
  for (const path of [
    "package.json",
    "examples/desktop/package.json",
    "examples/desktop/src-tauri/tauri.conf.json",
  ]) {
    const value = json(root, path);
    value.version = selected;
    save(path, JSON.stringify(value, null, 2) + "\n");
  }
  const changelog = "examples/desktop/CHANGELOG.md";
  const title = "# @lapismd/terminal-demo\n";
  const previousNotes = existsSync(join(root, changelog))
    ? read(root, changelog).slice(title.length)
    : "";
  save(
    changelog,
    `${title}\n## ${selected}\n\n### Patch Changes\n\n- Align the private demo with the coordinated terminal ${selected} distribution.\n${previousNotes}`,
  );
  const chapter = "spec/src/current/contracts/release.md";
  save(
    chapter,
    read(root, chapter).replace(
      `Prepared version: **${previous}**.`,
      `Prepared version: **${selected}**.`,
    ),
  );
  const evidence = `spec/src/history/releases/${selected}.md`;
  if (existsSync(join(root, evidence)))
    throw Error("release evidence already exists");
  mkdirSync(join(root, "spec/src/history/releases"), { recursive: true });
  save(
    evidence,
    `# Prepared release ${selected}\n\nEnclosing change: the Changesets version PR for ${selected}.\n\nLTERM-RELEASE-001: synchronized npm, Cargo, demo and lockfile metadata from\n${previous} to ${selected}. Existing runtime and UI contracts are unchanged.\n\nPreparation commands: \`pnpm exec changeset version\`, offline workspace Cargo\nupdate, lockfile-only pnpm install, \`pnpm release:check\` and formatting.\nThese must succeed before the version commit is created. This is metadata\npreparation evidence; the PR's CI records functional, browser, native and\npackaged-consumer results. No test result is inferred from version preparation.\n\nM5 review: release automation remains implemented; registry publication and\nconsumer adoption remain separate. The PR stays open for review.\n`,
  );
  save(
    "spec/src/SUMMARY.md",
    read(root, "spec/src/SUMMARY.md") +
      `- [Prepared release ${selected}](history/releases/${selected}.md)\n`,
  );
}
export async function prepareVersion(
  root = ".",
  execute = (command, args) =>
    execFileSync(command, args, { cwd: root, stdio: "inherit" }),
) {
  const original = checkRelease(root);
  const notes = await pendingChangesets(root);
  if (!notes.some((note) => note.releases.length))
    return { changed: false, version: original };
  execute("node", [
    "scripts/managed-cargo.mjs",
    "fetch",
    "--locked",
    "--offline",
  ]);
  execute("pnpm", ["exec", "changeset", "version"]);
  const selected = json(root, "packages/terminal/package.json").version;
  synchronizeVersion(root, selected);
  execute("node", [
    "scripts/managed-cargo.mjs",
    "update",
    "--workspace",
    "--offline",
  ]);
  execute("pnpm", [
    "install",
    "--lockfile-only",
    "--offline",
    "--ignore-pnpmfile",
  ]);
  execute("pnpm", ["release:check"]);
  execute("pnpm", [
    "exec",
    "prettier",
    "--write",
    "package.json",
    "packages/terminal/package.json",
    "packages/terminal/CHANGELOG.md",
    "examples/desktop/package.json",
    "examples/desktop/CHANGELOG.md",
    "examples/desktop/src-tauri/tauri.conf.json",
    "spec/src/current/contracts/release.md",
    "spec/src/SUMMARY.md",
    `spec/src/history/releases/${selected}.md`,
  ]);
  return { changed: true, version: selected };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(await prepareVersion());
