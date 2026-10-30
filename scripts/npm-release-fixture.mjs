import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { prepareArtifact } from "./npm-artifact.mjs";

export const sha = "a".repeat(40);
export const repository = "lapismd/lapis-terminal";
export const env = {
  GITHUB_REPOSITORY: repository,
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
};
export const run = {
  id: 123,
  event: "push",
  conclusion: "success",
  head_branch: "main",
  head_sha: sha,
  head_repository: { full_name: repository },
};
export const checks = ["macOS ARM64 checks", "Build specification"].map(
  (name) => ({
    name,
    head_sha: sha,
    app: { id: 15368 },
    status: "completed",
    conclusion: "success",
  }),
);
export const api = (path) =>
  path === "branches/main"
    ? { commit: { sha } }
    : path.startsWith("actions/")
      ? { workflow_runs: [run] }
      : { check_runs: checks };
export function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "terminal-npm-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [
    "Cargo.toml",
    "Cargo.lock",
    "package.json",
    ".changeset/config.json",
    "packages/terminal/package.json",
    "examples/desktop/package.json",
    "examples/desktop/src-tauri/Cargo.toml",
    "examples/desktop/src-tauri/tauri.conf.json",
    "spec/src/current/contracts/release.md",
    "spec/src/history/releases",
    ...[
      "lapis-terminal-engine",
      "lapis-terminal-runtime",
      "tauri-plugin-lapis-terminal",
    ].map((name) => `crates/${name}/Cargo.toml`),
  ]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(file, join(root, file), { recursive: true });
  }
  const version = JSON.parse(
    readFileSync("packages/terminal/package.json", "utf8"),
  ).version;
  const archiveRoot = join(root, "archive");
  for (const file of [
    "LICENSE.md",
    "NOTICE.md",
    "README.md",
    "dist/index.js",
    "dist/svelte/index.js",
    "dist/tauri/index.js",
    "dist/testing/index.js",
  ]) {
    const path = join(archiveRoot, "package", file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "fixture\n");
  }
  cpSync(
    "packages/terminal/package.json",
    join(archiveRoot, "package/package.json"),
  );
  mkdirSync(join(root, ".local/packages"), { recursive: true });
  execFileSync("tar", [
    "-czf",
    join(root, ".local/packages", `lapismd-terminal-${version}.tgz`),
    "-C",
    archiveRoot,
    "package",
  ]);
  return { root, manifest: prepareArtifact(root, sha) };
}
