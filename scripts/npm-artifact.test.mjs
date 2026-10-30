import test from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  artifactDirectory,
  inspectTarball,
  verifyArtifact,
} from "./npm-artifact.mjs";
import { fixture, sha } from "./npm-release-fixture.mjs";

test("qualified npm artifacts reject tampering and wrong source or version", (t) => {
  const { root, manifest } = fixture(t);
  assert.equal(
    verifyArtifact(root, manifest, sha),
    join(root, artifactDirectory, manifest.tarball),
  );
  for (const change of [
    { sha: "b".repeat(40) },
    { version: "9.9.9" },
    { tarball: "../../other.tgz" },
    { size: 1 },
  ])
    assert.throws(
      () => verifyArtifact(root, { ...manifest, ...change }, sha),
      /manifest|checksum/,
    );
  appendFileSync(join(root, artifactDirectory, manifest.tarball), "tampered");
  assert.throws(() => verifyArtifact(root, manifest, sha), /checksum/);
});

test("archive inspection rejects omitted exports and local dependency protocols", (t) => {
  const { root, manifest } = fixture(t);
  const packageFile = join(root, "archive/package/package.json");
  writeFileSync(
    packageFile,
    JSON.stringify({
      name: manifest.name,
      version: manifest.version,
      publishConfig: { access: "public" },
      dependencies: { bad: "file:../private" },
    }),
  );
  const file = join(root, "test.tgz");
  execFileSync("tar", ["-czf", file, "-C", join(root, "archive"), "package"]);
  assert.throws(
    () => inspectTarball(file, manifest.version),
    /local dependency/,
  );
  execFileSync("tar", [
    "-czf",
    file,
    "-C",
    join(root, "archive"),
    "package/package.json",
  ]);
  assert.throws(() => inspectTarball(file, manifest.version), /omits/);
});
