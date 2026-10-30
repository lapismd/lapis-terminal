import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRelease } from "./release-state.mjs";
import { packageName } from "./npm-registry.mjs";

export const artifactDirectory = ".local/npm-release";
export function inspectTarball(file, version) {
  const members = execFileSync("tar", ["-tzf", file], { encoding: "utf8" })
    .trim()
    .split("\n");
  for (const required of [
    "package.json",
    "LICENSE.md",
    "NOTICE.md",
    "README.md",
    "dist/index.js",
    "dist/svelte/index.js",
    "dist/tauri/index.js",
    "dist/testing/index.js",
  ])
    if (!members.includes(`package/${required}`))
      throw Error(`npm artifact omits ${required}`);
  if (
    members.some(
      (path) =>
        !path.startsWith("package/") ||
        path.split("/").includes("..") ||
        /(?:^|\/)(?:node_modules|target|\.local|\.npmrc)(?:\/|$)/.test(path),
    )
  )
    throw Error("npm artifact contains private or unsafe paths");
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOf", file, "package/package.json"], {
      encoding: "utf8",
    }),
  );
  if (
    manifest.name !== packageName ||
    manifest.version !== version ||
    manifest.private ||
    manifest.publishConfig?.access !== "public"
  )
    throw Error("npm artifact identity or public access differs");
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ])
    if (
      Object.values(manifest[field] ?? {}).some((range) =>
        /^(?:file|link|workspace):/.test(range),
      )
    )
      throw Error("npm artifact contains a local dependency protocol");
}

export function verifyArtifact(root, manifest, sha) {
  const version = checkRelease(root);
  if (
    manifest.name !== packageName ||
    manifest.version !== version ||
    manifest.sha !== sha ||
    !/^[a-f0-9]{40}$/.test(sha) ||
    manifest.tarball !== `lapismd-terminal-${version}.tgz`
  )
    throw Error("npm artifact manifest does not match the qualified revision");
  const file = join(root, artifactDirectory, manifest.tarball);
  const bytes = readFileSync(file);
  if (
    manifest.size !== bytes.length ||
    manifest.sha256 !== createHash("sha256").update(bytes).digest("hex") ||
    manifest.integrity !==
      `sha512-${createHash("sha512").update(bytes).digest("base64")}`
  )
    throw Error("npm artifact checksum differs");
  inspectTarball(file, version);
  return file;
}

export function prepareArtifact(root, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? ""))
    throw Error("The exact checked revision is required");
  const version = checkRelease(root);
  const source = join(
    root,
    ".local/packages",
    `lapismd-terminal-${version}.tgz`,
  );
  inspectTarball(source, version);
  const bytes = readFileSync(source);
  const manifest = {
    schema: 1,
    name: packageName,
    version,
    sha,
    tarball: basename(source),
    size: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
  };
  mkdirSync(join(root, artifactDirectory), { recursive: true });
  copyFileSync(source, join(root, artifactDirectory, manifest.tarball));
  writeFileSync(
    join(root, artifactDirectory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  verifyArtifact(root, manifest, sha);
  return manifest;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(
    JSON.stringify(prepareArtifact(".", process.env.LAPIS_TERMINAL_CHECK_HEAD)),
  );
