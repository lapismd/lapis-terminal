import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  npmRegistered,
  npmVersion,
  packageName,
  registry,
  verifyProvenance,
  verifyPublished,
} from "./npm-registry.mjs";

const bytes = Buffer.from("qualified npm tarball");
const manifest = {
  version: "0.1.2",
  sha: "a".repeat(40),
  integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
};
const metadata = {
  name: packageName,
  version: manifest.version,
  dist: {
    integrity: manifest.integrity,
    tarball: `${registry}/terminal.tgz`,
    signatures: [{ sig: "fixture" }],
    attestations: { url: `${registry}/attestations` },
  },
};
const statement = () => ({
  subject: [
    { digest: { sha512: createHash("sha512").update(bytes).digest("hex") } },
  ],
  predicate: {
    buildDefinition: {
      externalParameters: {
        workflow: {
          repository: "https://github.com/lapismd/lapis-terminal",
          ref: "refs/heads/main",
          path: ".github/workflows/publish-npm.yml",
        },
      },
      internalParameters: {
        github: {
          event_name: "workflow_dispatch",
          repository_id: "1422167487",
          repository_owner_id: "311425888",
        },
      },
      resolvedDependencies: [{ digest: { gitCommit: manifest.sha } }],
    },
  },
});
const attest = (value = statement()) => ({
  attestations: [
    {
      predicateType: "https://slsa.dev/provenance/v1",
      bundle: {
        dsseEnvelope: {
          payload: Buffer.from(JSON.stringify(value)).toString("base64"),
        },
      },
    },
  ],
});
const response = (status, value) => ({
  status,
  ok: status === 200,
  json: async () => value,
  arrayBuffer: async () => value,
});

test("npm registry lookup treats only 404 as absence and rejects malformed identity", async () => {
  assert.equal(
    await npmVersion(manifest.version, async () => response(404)),
    null,
  );
  assert.equal(await npmRegistered(async () => response(404)), false);
  assert.equal(await npmRegistered(async () => response(200, metadata)), true);
  for (const status of [401, 403, 429, 503]) {
    await assert.rejects(
      npmVersion(manifest.version, async () => response(status)),
      new RegExp(`HTTP ${status}`),
    );
    await assert.rejects(
      npmRegistered(async () => response(status)),
      new RegExp(`HTTP ${status}`),
    );
  }
  for (const value of [
    { ...metadata, version: "wrong" },
    { ...metadata, name: "wrong" },
    {
      ...metadata,
      dist: { ...metadata.dist, tarball: "https://other.example/file.tgz" },
    },
  ])
    await assert.rejects(
      npmVersion(manifest.version, async () => response(200, value)),
      /Malformed/,
    );
});

test("npm provenance must bind exact source, main workflow and tarball digest", () => {
  verifyProvenance(attest(), manifest);
  for (const mutate of [
    (s) => (s.subject[0].digest.sha512 = "wrong"),
    (s) =>
      (s.predicate.buildDefinition.externalParameters.workflow.repository =
        "https://github.com/fork/terminal"),
    (s) =>
      (s.predicate.buildDefinition.externalParameters.workflow.path =
        ".github/workflows/untrusted.yml"),
    (s) =>
      (s.predicate.buildDefinition.externalParameters.workflow.ref =
        "refs/heads/feature"),
    (s) =>
      (s.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit =
        "b".repeat(40)),
    (s) => delete s.predicate.buildDefinition.internalParameters,
    (s) =>
      (s.predicate.buildDefinition.internalParameters.github.event_name =
        "push"),
    (s) =>
      (s.predicate.buildDefinition.internalParameters.github.repository_id =
        "42"),
    (s) =>
      (s.predicate.buildDefinition.internalParameters.github.repository_owner_id =
        "42"),
  ]) {
    const value = statement();
    mutate(value);
    assert.throws(
      () => verifyProvenance(attest(value), manifest),
      /does not bind/,
    );
  }
});

test("registry verification retries propagation 404 but never integrity or server failures", async () => {
  let downloads = 0;
  const delays = [];
  const request = async (url) =>
    url.endsWith("terminal.tgz")
      ? response(++downloads === 1 ? 404 : 200, bytes)
      : url.endsWith("attestations")
        ? response(200, attest())
        : response(200, metadata);
  assert.equal(
    (
      await verifyPublished(manifest, {
        request,
        sleep: async (ms) => delays.push(ms),
      })
    ).version,
    manifest.version,
  );
  assert.deepEqual(delays, [5000]);
  assert.equal(downloads, 2);
  for (const request of [
    async () => response(503),
    async () =>
      response(200, {
        ...metadata,
        dist: { ...metadata.dist, integrity: "sha512-bad" },
      }),
    async (url) =>
      url.endsWith("terminal.tgz")
        ? response(200, Buffer.from("tampered"))
        : response(200, metadata),
  ])
    await assert.rejects(
      verifyPublished(manifest, {
        request,
        sleep: async () => assert.fail("fatal error retried"),
      }),
      /HTTP 503|integrity differs/,
    );
  let attempts = 0;
  await assert.rejects(
    verifyPublished(manifest, {
      request: async () => {
        attempts++;
        return response(404);
      },
      sleep: async () => {},
    }),
    /propagation pending/,
  );
  assert.equal(attempts, 5);
});
