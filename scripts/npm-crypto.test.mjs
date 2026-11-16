import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { cryptoFixture } from "./npm-crypto-fixture.mjs";
import {
  inspectCryptoRuntime,
  verifyTerminalProvenance,
} from "./npm-crypto.mjs";

const policy = {
  certificateIssuer: "https://token.actions.githubusercontent.com",
  certificateIdentityURI:
    "^https://github\\.com/lapismd/lapis-terminal/\\.github/workflows/publish-npm\\.yml@refs/heads/main$",
};

test("the real pinned verifier binds Terminal certificate ownership, source and SHA512 subject", async () => {
  const { bundle, ...context } = await cryptoFixture("terminal");
  const signer = await verifyTerminalProvenance(bundle, policy, context);
  assert.equal(signer.identity.extensions.issuer, policy.certificateIssuer);
  assert.equal(
    signer.identity.subjectAlternativeName,
    "https://github.com/lapismd/lapis-terminal/.github/workflows/publish-npm.yml@refs/heads/main",
  );
  assert.equal(signer.certificate.sourceRepositoryIdentifier, "1422167487");
  assert.equal(signer.certificate.sourceRepositoryOwnerIdentifier, "311425888");
});

test("real verification rejects changed artifact, source, version, payload and missing log evidence", async () => {
  const { bundle, ...context } = await cryptoFixture("terminal");
  for (const changed of [
    {
      ...context,
      artifact: Buffer.concat([context.artifact, Buffer.from("changed")]),
    },
    { ...context, sourceSha: "a".repeat(40) },
    { ...context, version: "0.1.3" },
  ])
    await assert.rejects(verifyTerminalProvenance(bundle, policy, changed));
  const payload = structuredClone(bundle);
  payload.dsseEnvelope.payload = Buffer.from("{}").toString("base64");
  await assert.rejects(verifyTerminalProvenance(payload, policy, context));
  const signature = structuredClone(bundle);
  const bytes = Buffer.from(signature.dsseEnvelope.signatures[0].sig, "base64");
  bytes[bytes.length - 1] ^= 1;
  signature.dsseEnvelope.signatures[0].sig = bytes.toString("base64");
  await assert.rejects(verifyTerminalProvenance(signature, policy, context));
  const log = structuredClone(bundle);
  log.verificationMaterial.tlogEntries = [];
  await assert.rejects(verifyTerminalProvenance(log, policy, context));
  await assert.rejects(verifyTerminalProvenance(bundle, policy, {}));
});

test("the foreign fixture is cryptographically valid under its real owner", async (t) => {
  const { bundle, artifact, sourceSha } = await cryptoFixture("core");
  const runtime = await inspectCryptoRuntime();
  const directory = await mkdtemp(join(tmpdir(), "terminal-foreign-proof-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "package.tgz"), artifact);
  await writeFile(join(directory, "bundle.json"), JSON.stringify(bundle));
  await writeFile(join(directory, "root.jsonl"), runtime.trustedRoot + "\n");
  const { stdout } = await promisify(execFile)(
    runtime.binary,
    [
      "attestation",
      "verify",
      join(directory, "package.tgz"),
      "--digest-alg",
      "sha512",
      "--bundle",
      join(directory, "bundle.json"),
      "--repo",
      "lapismd/design-core",
      "--cert-identity",
      "https://github.com/lapismd/design-core/.github/workflows/release.yml@refs/heads/main",
      "--cert-oidc-issuer",
      policy.certificateIssuer,
      "--source-digest",
      sourceSha,
      "--source-ref",
      "refs/heads/main",
      "--signer-digest",
      sourceSha,
      "--deny-self-hosted-runners",
      "--custom-trusted-root",
      join(directory, "root.jsonl"),
      "--format",
      "json",
    ],
    {
      env: {
        GH_CONFIG_DIR: join(directory, "config"),
        GH_HOST: "github.com",
        GH_PROMPT_DISABLED: "1",
      },
      timeout: 60000,
    },
  );
  const result = JSON.parse(stdout);
  assert.equal(result.length, 1);
  assert(result[0].verificationResult.verifiedTimestamps.length > 0);
  assert.equal(
    result[0].verificationResult.signature.certificate.sourceRepositoryDigest,
    sourceSha,
  );
});

test("a valid foreign bundle cannot satisfy Terminal's fixed workflow and issuer policy", async () => {
  const { bundle, ...context } = await cryptoFixture("core");
  await assert.rejects(verifyTerminalProvenance(bundle, policy, context));
  const own = await cryptoFixture("terminal");
  await assert.rejects(
    verifyTerminalProvenance(
      own.bundle,
      { ...policy, certificateIssuer: "https://wrong.invalid" },
      own,
    ),
  );
  await assert.rejects(
    verifyTerminalProvenance(
      own.bundle,
      { ...policy, certificateIdentityURI: "^.*$" },
      own,
    ),
  );
});

test("a tool cannot be admitted by a spoofed version string or unavailable binary", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "terminal-gh-negative-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const fake = join(directory, "gh");
  await writeFile(fake, '#!/bin/sh\necho "gh version 2.102.0 (spoofed)"\n', {
    mode: 0o755,
  });
  await assert.rejects(inspectCryptoRuntime(fake));
  await assert.rejects(inspectCryptoRuntime(join(directory, "absent")));
});
