import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import YAML from "yaml";

const workflow = (name) =>
  YAML.parse(
    readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      "utf8",
    ),
  );
function setup(steps) {
  const matches = steps.filter((step) =>
    step.uses?.startsWith("lapismd/lapis-ci/actions/setup-gh@"),
  );
  assert.equal(
    matches.length,
    1,
    "One shared verified GitHub CLI setup is required",
  );
  assert.equal(
    matches[0].uses,
    "lapismd/lapis-ci/actions/setup-gh@cfadc45863cb31d6ca0eb0882f8e618ea38c1052",
  );
  return matches[0];
}

test("required macOS source CI installs the shared verified CLI before real crypto tests", () => {
  const ci = workflow("ci");
  const job = ci.jobs.validate;
  assert.equal(job["runs-on"], "macos-15");
  const step = setup(job.steps);
  assert.equal(
    step.if,
    undefined,
    "Ordinary source checks must exercise cryptography",
  );
  const tests = job.steps.findIndex((entry) => entry.run === "pnpm test");
  assert(tests >= 0 && job.steps.indexOf(step) < tests);
  assert.equal(ci.permissions.contents, "read");
});

test("the detached attestation boundary uses the same pinned shared tool only in attest mode", () => {
  const job = workflow("publish-npm").jobs.publish;
  const step = setup(job.steps);
  assert.equal(step.uses, setup(workflow("ci").jobs.validate.steps).uses);
  assert.equal(step.if, "inputs.mode == 'attest'");
  const signing = job.steps.findIndex(
    (entry) => entry.run === "node scripts/npm-release.mjs attest",
  );
  assert(signing >= 0 && job.steps.indexOf(step) < signing);
  assert.equal(job.environment, "npm-production");
  assert.equal(job.permissions["id-token"], "write");
});
