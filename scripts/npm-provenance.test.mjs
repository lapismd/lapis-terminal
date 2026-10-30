import test from "node:test";
import { verify } from "sigstore";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  prepareProvenance,
  provenanceStatement,
  verifyBootstrapSigner,
} from "./npm-provenance.mjs";
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
  const check = async (bundle, policy) => {
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
    return {
      identity: {
        extensions: { issuer: "https://token.actions.githubusercontent.com" },
        subjectAlternativeName:
          "https://github.com/lapismd/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
      },
    };
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
  for (const signer of [
    undefined,
    { identity: { extensions: { issuer: "wrong" } } },
    {
      identity: {
        extensions: { issuer: "https://token.actions.githubusercontent.com" },
        subjectAlternativeName:
          "https://github.com/fork/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
      },
    },
  ])
    await assert.rejects(
      prepareProvenance(root, plan, manifest, {
        env,
        sign,
        check: async () => signer,
      }),
      /signer does not match/,
    );
});

// Public npm registry provenance: fixture digest and source are recorded in
// spec/src/history/2026-10-31-bootstrap-identity.md. The verifier obtains TUF
// trust metadata; no signing identity or npm authentication is needed.
test("the real Sigstore verifier rejects a cryptographically valid foreign workflow", async () => {
  const bundle = JSON.parse(
    readFileSync(
      new URL("./fixtures/design-core-0.7.1-provenance.json", import.meta.url),
      "utf8",
    ),
  );
  const signer = await verify(bundle);
  assert.equal(
    signer.identity.subjectAlternativeName,
    "https://github.com/lapismd/design-core/.github/workflows/release.yml@refs/heads/main",
  );
  await assert.rejects(
    verifyBootstrapSigner(bundle),
    /certificate identity|signer does not match/,
  );
  const tampered = structuredClone(bundle);
  tampered.dsseEnvelope.payload = Buffer.from("{}").toString("base64");
  await assert.rejects(verifyBootstrapSigner(tampered));
});
