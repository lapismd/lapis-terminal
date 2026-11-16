import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import YAML from "yaml";

const read = (name) =>
  readFileSync(new URL("../" + name, import.meta.url), "utf8");
const manifest = JSON.parse(read("package.json"));
const lock = YAML.parse(read("pnpm-lock.yaml"));
const semver = createRequire(
  realpathSync(
    new URL("../node_modules/@changesets/cli/package.json", import.meta.url),
  ),
)("semver");

test("the aligned Storybook cohort excludes the audited critical and high ranges", () => {
  const selected = manifest.devDependencies.storybook;
  assert(semver.satisfies(selected, ">=10.6.2 <11"));
  for (const name of [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@storybook/svelte",
    "@storybook/svelte-vite",
  ])
    assert.equal(manifest.devDependencies[name], selected, name);
});

test("the actual frozen graph excludes both vulnerable signature-cache package ranges", () => {
  const unsafe = { glob: ">=9.0.0 <=14.0.1", minimatch: ">=7.0.0 <11.0.1" };
  for (const id of Object.keys(lock.packages))
    for (const [name, range] of Object.entries(unsafe))
      if (id.startsWith(name + "@"))
        assert(
          !semver.satisfies(id.slice(name.length + 1).split("(")[0], range),
          `${id}: ${range}`,
        );
});
