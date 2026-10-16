import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import TOML from "@iarna/toml";
import readModule from "@changesets/read";
export const crates = [
  "lapis-terminal-engine",
  "lapis-terminal-runtime",
  "tauri-plugin-lapis-terminal",
];
export const read = (root, path) => readFileSync(join(root, path), "utf8");
export const json = (root, path) => JSON.parse(read(root, path));
export const manifest = (root, path) => TOML.parse(read(root, path));
export function checkRelease(root = ".") {
  const selected = json(root, "packages/terminal/package.json").version;
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(selected))
    throw Error("stable coordinated version required");
  const workspace = manifest(root, "Cargo.toml").workspace;
  if (workspace.package.version !== selected)
    throw Error("Cargo and npm versions differ");
  const locked = manifest(root, "Cargo.lock").package;
  for (const name of [...crates, "lapis-terminal-demo"]) {
    const path =
      name === "lapis-terminal-demo"
        ? "examples/desktop/src-tauri"
        : `crates/${name}`;
    const cargo = manifest(root, `${path}/Cargo.toml`);
    if (cargo.package.version?.workspace !== true)
      throw Error(`${name}: must inherit coordinated version`);
    const entries = locked.filter(
      (entry) => entry.name === name && !entry.source,
    );
    if (entries.length !== 1 || entries[0].version !== selected)
      throw Error(`${name}: stale Cargo lock version`);
    for (const [dependency, value] of Object.entries(cargo.dependencies ?? {}))
      if (crates.includes(dependency) && value.version !== selected)
        throw Error(`${name}: internal dependency version differs`);
  }
  for (const path of [
    "package.json",
    "examples/desktop/package.json",
    "examples/desktop/src-tauri/tauri.conf.json",
  ])
    if (json(root, path).version !== selected)
      throw Error(`${path}: version differs`);
  for (const path of ["package.json", "examples/desktop/package.json"])
    if (json(root, path).private !== true)
      throw Error(`${path}: must stay private`);
  if (
    json(root, "packages/terminal/package.json").publishConfig?.access !==
    "public"
  )
    throw Error("npm access must be public");
  const config = json(root, ".changeset/config.json");
  if (
    config.baseBranch !== "main" ||
    config.privatePackages?.version !== false ||
    config.privatePackages?.tag !== false
  )
    throw Error("unexpected Changesets policy");
  if (
    !read(root, "spec/src/current/contracts/release.md").includes(
      `Prepared version: **${selected}**.`,
    )
  )
    throw Error("canonical release metadata differs");
  return selected;
}
export async function pendingChangesets(root = ".") {
  const notes = await (readModule.default ?? readModule)(resolve(root));
  for (const note of notes)
    for (const release of note.releases)
      if (
        release.name !== "@lapismd/terminal" ||
        !["patch", "minor", "major"].includes(release.type)
      )
        throw Error("Changesets must target @lapismd/terminal");
  return notes;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(`Coordinated release metadata verified at ${checkRelease()}`);
  console.log(`${(await pendingChangesets()).length} pending changeset(s)`);
}
