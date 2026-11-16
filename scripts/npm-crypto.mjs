import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, writeFile, rm, realpath } from "node:fs/promises";
import { delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import {
  packageName,
  githubRepositoryId,
  githubOwnerId,
} from "./npm-registry.mjs";
import { repository } from "./cargo-release.mjs";

const run = promisify(execFile);
const tools = JSON.parse(
  await readFile(new URL("./npm-crypto-tools.json", import.meta.url), "utf8"),
);
const identity = `https://github.com/${repository}/.github/workflows/publish-npm.yml@refs/heads/main`;
const issuer = "https://token.actions.githubusercontent.com";
const digest = (bytes, algorithm = "sha256") =>
  createHash(algorithm).update(bytes).digest("hex");
const policy = {
  certificateIssuer: issuer,
  certificateIdentityURI: `^${identity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
};
const childEnv = (directory) => ({
  PATH: dirname(process.execPath),
  GH_CONFIG_DIR: directory,
  GH_HOST: "github.com",
  GH_PROMPT_DISABLED: "1",
  NO_COLOR: "1",
});

export async function inspectCryptoRuntime(binary) {
  assert.match(
    process.versions.node,
    /^24\./,
    "Cryptographic verification requires qualified Node24",
  );
  const expected = tools.binarySha256[`${process.platform}/${process.arch}`];
  assert.ok(expected, "Unsupported cryptographic verifier platform");
  if (!binary) {
    for (const entry of (process.env.PATH ?? "").split(delimiter)) {
      try {
        binary = await realpath(join(entry, "gh"));
        break;
      } catch {
        /* next PATH entry */
      }
    }
  }
  assert.ok(binary, "Pinned GitHub CLI is unavailable");
  assert.equal(
    digest(await readFile(binary)),
    expected,
    "Unqualified GitHub CLI binary",
  );
  const result = await run(binary, ["--version"], {
    env: childEnv(tmpdir()),
    timeout: 10000,
  });
  assert.ok(
    result.stdout.startsWith(`gh version ${tools.ghVersion} `),
    "Unqualified GitHub CLI version",
  );
  const seedFile = resolve(
    dirname(process.execPath),
    "../lib/node_modules/npm/node_modules/@sigstore/tuf/seeds.json",
  );
  const bytes = await readFile(seedFile);
  assert.equal(
    digest(bytes),
    tools.seedSha256,
    "Unqualified public trust seed",
  );
  const seed =
    JSON.parse(bytes)["https://tuf-repo-cdn.sigstore.dev"].targets[
      "trusted_root.json"
    ];
  const trustedRoot = JSON.stringify(JSON.parse(Buffer.from(seed, "base64")));
  assert.equal(
    digest(trustedRoot),
    tools.trustedRootSha256,
    "Unqualified public trusted root",
  );
  return { binary, trustedRoot };
}

export async function verifyTerminalProvenance(
  bundle,
  requestedPolicy,
  context = {},
) {
  assert.deepEqual(
    requestedPolicy,
    policy,
    "Certificate identity policy must remain exact",
  );
  const { artifact, sourceSha, version } = context;
  assert.ok(
    Buffer.isBuffer(artifact),
    "Verification requires actual artifact bytes",
  );
  assert.match(
    sourceSha ?? "",
    /^[a-f0-9]{40}$/,
    "Verification requires immutable source",
  );
  assert.match(
    version ?? "",
    /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/,
    "Verification requires exact version",
  );
  assert.ok(
    bundle?.verificationMaterial?.tlogEntries?.length > 0,
    "Transparency log evidence is required",
  );
  const statement = JSON.parse(
    Buffer.from(bundle?.dsseEnvelope?.payload ?? "", "base64"),
  );
  assert.equal(statement.predicateType, "https://slsa.dev/provenance/v1");
  assert.deepEqual(
    statement.subject,
    [
      {
        name: `pkg:npm/${packageName.replace("@", "%40")}@${version}`,
        digest: { sha512: digest(artifact, "sha512") },
      },
    ],
    "Artifact subject mismatch",
  );
  const runtime = await inspectCryptoRuntime();
  const directory = await mkdtemp(join(tmpdir(), "terminal-provenance-"));
  try {
    const artifactFile = join(directory, "package.tgz");
    const bundleFile = join(directory, "bundle.json");
    const trustFile = join(directory, "trusted-root.jsonl");
    await writeFile(artifactFile, artifact, { mode: 0o600 });
    await writeFile(bundleFile, JSON.stringify(bundle), { mode: 0o600 });
    await writeFile(trustFile, runtime.trustedRoot + "\n", { mode: 0o600 });
    const { stdout } = await run(
      runtime.binary,
      [
        "attestation",
        "verify",
        artifactFile,
        "--digest-alg",
        "sha512",
        "--bundle",
        bundleFile,
        "--repo",
        repository,
        "--predicate-type",
        "https://slsa.dev/provenance/v1",
        "--cert-identity",
        identity,
        "--cert-oidc-issuer",
        issuer,
        "--source-digest",
        sourceSha,
        "--source-ref",
        "refs/heads/main",
        "--signer-digest",
        sourceSha,
        "--deny-self-hosted-runners",
        "--custom-trusted-root",
        trustFile,
        "--format",
        "json",
      ],
      {
        env: childEnv(join(directory, "config")),
        timeout: 60000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    const results = JSON.parse(stdout);
    assert.equal(results.length, 1, "Exactly one verified result is required");
    const result = results[0].verificationResult;
    assert.ok(
      result.verifiedTimestamps?.length > 0,
      "Verified timestamp is required",
    );
    assert.deepEqual(
      result.statement,
      statement,
      "Verifier returned a different statement",
    );
    const certificate = result.signature?.certificate;
    for (const [key, value] of Object.entries({
      issuer,
      subjectAlternativeName: identity,
      sourceRepositoryURI: `https://github.com/${repository}`,
      sourceRepositoryDigest: sourceSha,
      sourceRepositoryRef: "refs/heads/main",
      sourceRepositoryIdentifier: githubRepositoryId,
      sourceRepositoryOwnerIdentifier: githubOwnerId,
      runnerEnvironment: "github-hosted",
      buildSignerURI: identity,
      buildSignerDigest: sourceSha,
    }))
      assert.equal(
        certificate?.[key],
        value,
        `Verified certificate ${key} mismatch`,
      );
    return {
      identity: {
        extensions: { issuer: certificate.issuer },
        subjectAlternativeName: certificate.subjectAlternativeName,
      },
      certificate,
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
