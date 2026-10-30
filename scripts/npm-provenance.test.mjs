import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { prepareProvenance, provenanceStatement } from "./npm-provenance.mjs";
import { env as base, fixture, sha } from "./npm-release-fixture.mjs";
const env = {
  ...base,
  GITHUB_WORKFLOW_REF:
    "lapismd/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  RUNNER_ENVIRONMENT: "github-hosted",
  GITHUB_RUN_ID: "123",
  GITHUB_RUN_ATTEMPT: "1",
};

test("detached npm provenance binds one PURL subject and the exact main workflow source", (t) => {
  const { manifest } = fixture(t);
  const statement = provenanceStatement({ sha }, manifest, env);
  assert.equal(statement.subject.length, 1);
  assert.equal(
    statement.subject[0].name,
    `pkg:npm/%40lapismd/terminal@${manifest.version}`,
  );
  assert.equal(
    statement.subject[0].digest.sha512,
    Buffer.from(manifest.integrity.slice(7), "base64").toString("hex"),
  );
  assert.equal(
    statement.predicate.buildDefinition.resolvedDependencies[0].digest
      .gitCommit,
    sha,
  );
  for (const change of [
    { GITHUB_REF: "refs/heads/feature" },
    { GITHUB_SHA: "b".repeat(40) },
    { GITHUB_WORKFLOW_REF: "other/workflow@refs/heads/main" },
    { RUNNER_ENVIRONMENT: "self-hosted" },
    { GITHUB_EVENT_NAME: "pull_request" },
  ])
    assert.throws(
      () => provenanceStatement({ sha }, manifest, { ...env, ...change }),
      /exact main/,
    );
});

test("bootstrap bundles are written only after exact statement and cryptographic identity verification", async (t) => {
  const { root, manifest } = fixture(t);
  const plan = { sha, mode: "attest" };
  let verified = false;
  const sign = async (payload, type) => {
    assert.equal(type, "application/vnd.in-toto+json");
    return { dsseEnvelope: { payload: payload.toString("base64") } };
  };
  const check = async (bundle, payload, policy) => {
    assert.equal(payload, undefined);
    assert.equal(
      policy.certificateIssuer,
      "https://token.actions.githubusercontent.com",
    );
    assert.ok(
      new RegExp(policy.certificateIdentityURI).test(
        "https://github.com/lapismd/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
      ),
    );
    assert.ok(
      !new RegExp(policy.certificateIdentityURI).test(
        "https://github.com/fork/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
      ),
    );
    verified = true;
  };
  const file = await prepareProvenance(root, plan, manifest, {
    env,
    sign,
    check,
  });
  assert.ok(verified && existsSync(file));
  assert.ok(JSON.parse(readFileSync(file, "utf8")).dsseEnvelope.payload);
  await assert.rejects(
    prepareProvenance(root, { ...plan, mode: "publish" }, manifest, {
      env,
      sign,
      check,
    }),
    /explicit attest/,
  );
  await assert.rejects(
    prepareProvenance(root, plan, manifest, {
      env,
      sign: async () => ({
        dsseEnvelope: { payload: Buffer.from("{}").toString("base64") },
      }),
      check: () => assert.fail("different statement verified"),
    }),
    /different/,
  );
  await assert.rejects(
    prepareProvenance(root, plan, manifest, {
      env,
      sign,
      check: async () => {
        throw Error("bad signature");
      },
    }),
    /bad signature/,
  );
});
