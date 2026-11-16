import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import YAML from "yaml";

const workflow = YAML.parse(
  readFileSync(
    new URL("../.github/workflows/changesets.yml", import.meta.url),
    "utf8",
  ),
);
const version = workflow.jobs.version;
const selected = "steps.versioning.outputs.hasChangesets == 'true'";

test("actual version intent must qualify source inputs before Terminal can acquire a writer", () => {
  const guard = version.steps.find((step) => step.id === "versioning");
  assert(guard, "Version planning needs the qualified shared guard");
  assert.equal(
    guard.uses,
    "lapismd/lapis-ci/actions/guard-version-runtime@66f0bf9074fac06412796005a39c7caec4bf86d5",
  );
  assert.deepEqual(guard.with, {
    "qualification-file": ".github/versioning-runtime.json",
    "detect-release-intent": "true",
  });
  assert.equal(guard.if, undefined);
  assert.equal(guard["continue-on-error"], undefined);
  const app = version.steps.find((step) => step.id === "app");
  const writer = version.steps.find((step) => step.id === "changesets");
  const setup = version.steps.find(
    (step) => step.run === "pnpm install --frozen-lockfile --ignore-pnpmfile",
  );
  assert(version.steps.indexOf(setup) < version.steps.indexOf(guard));
  assert(version.steps.indexOf(guard) < version.steps.indexOf(app));
  assert(version.steps.indexOf(app) < version.steps.indexOf(writer));
  for (const step of [app, writer]) assert.equal(step.if, selected);
  const node = version.steps.find((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  assert.equal(node.with["node-version"], "24.15.0");
  assert.equal(writer.with.version, "pnpm release:version");
});

test("the runtime decision binds the actual installed recipe and keeps the native/version contract intact", () => {
  const root = new URL("../", import.meta.url),
    q = JSON.parse(
      readFileSync(new URL(".github/versioning-runtime.json", root), "utf8"),
    );
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const hash = (file) =>
    createHash("sha256")
      .update(readFileSync(new URL(file, root)))
      .digest("hex");
  assert.equal(q.schemaVersion, 1);
  assert.equal(q.nodeMajor, 24);
  assert.equal(q.cliVersion, "2.31.1");
  assert.equal(q.packageManager, pkg.packageManager);
  assert.equal(q.configSha256, hash(".changeset/config.json"));
  assert.deepEqual(Object.keys(q.scripts).sort(), [
    "dev:cargo",
    "release:check",
    "release:version",
  ]);
  for (const [name, command] of Object.entries(q.scripts))
    assert.equal(pkg.scripts[name], command);
  assert.deepEqual(Object.keys(q.files).sort(), [
    ".prettierignore",
    ".prettierrc.json",
    "pnpm-workspace.yaml",
    "rust-toolchain.toml",
    "scripts/changeset-version.mjs",
    "scripts/managed-cargo.mjs",
    "scripts/release-state.mjs",
  ]);
  for (const [file, expected] of Object.entries(q.files))
    assert.equal(
      hash(file),
      expected,
      `${file} changed; qualify the real recipe again`,
    );
});
