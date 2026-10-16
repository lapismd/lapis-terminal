import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import {
  publish,
  registryVersion,
  releaseTrigger,
  requireQualification,
  releasePlan,
  repository,
} from "./cargo-release.mjs";
const sha = "a".repeat(40);
const run = {
  event: "push",
  conclusion: "success",
  head_branch: "main",
  head_sha: sha,
  head_repository: { full_name: repository },
};
const env = {
  GITHUB_REPOSITORY: repository,
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
};
const checks = ["macOS ARM64 checks", "Build specification"].map((name) => ({
  name,
  head_sha: sha,
  app: { id: 15368 },
  status: "completed",
  conclusion: "success",
}));

test("ordinary commits defer publication until the version PR consumes changesets", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "lapis-release-plan-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [
    "Cargo.toml",
    "Cargo.lock",
    "package.json",
    ".changeset/config.json",
    "packages/terminal/package.json",
    "examples/desktop/package.json",
    "examples/desktop/src-tauri/Cargo.toml",
    "examples/desktop/src-tauri/tauri.conf.json",
    "spec/src/current/contracts/release.md",
    "spec/src/history/releases",
    ...[
      "lapis-terminal-engine",
      "lapis-terminal-runtime",
      "tauri-plugin-lapis-terminal",
    ].map((name) => `crates/${name}/Cargo.toml`),
  ]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(file, join(root, file), { recursive: true });
  }
  writeFileSync(
    join(root, ".changeset/pending-test.md"),
    '---\n"@lapismd/terminal": patch\n---\nPending change.\n',
  );
  const api = (path) =>
    path === "branches/main"
      ? { commit: { sha } }
      : path.startsWith("actions/")
        ? { workflow_runs: [run] }
        : { check_runs: checks };
  const deferred = await releasePlan(root, { sha, mode: "publish" }, api, () =>
    assert.fail("registry queried before version preparation"),
  );
  assert.equal(deferred.deferred, true);
  assert.deepEqual(deferred.missing, []);
  await assert.rejects(
    releasePlan(root, { sha, mode: "verify" }, api),
    /Unreleased/,
  );
  rmSync(join(root, ".changeset/pending-test.md"));
  const ready = await releasePlan(
    root,
    { sha, mode: "publish" },
    api,
    async (name) => (name === "lapis-terminal-engine" ? {} : null),
  );
  assert.deepEqual(ready.missing, [
    "lapis-terminal-runtime",
    "tauri-plugin-lapis-terminal",
  ]);
});

test("release triggers reject fork, PR, failed CI and non-main manual runs", () => {
  assert.deepEqual(releaseTrigger("workflow_run", { workflow_run: run }, env), {
    sha,
    mode: "publish",
  });
  for (const change of [
    { event: "pull_request" },
    { conclusion: "failure" },
    { head_branch: "feature" },
    { head_repository: { full_name: "other/repo" } },
  ])
    assert.throws(() =>
      releaseTrigger(
        "workflow_run",
        { workflow_run: { ...run, ...change } },
        env,
      ),
    );
  assert.throws(() =>
    releaseTrigger(
      "workflow_dispatch",
      { inputs: { mode: "publish" } },
      { ...env, GITHUB_REF: "refs/heads/feature" },
    ),
  );
  assert.throws(() =>
    releaseTrigger(
      "workflow_run",
      { workflow_run: run },
      { ...env, GITHUB_REPOSITORY: "other/repo" },
    ),
  );
  assert.deepEqual(
    releaseTrigger("workflow_dispatch", { inputs: { mode: "verify" } }, env),
    { sha, mode: "verify" },
  );
});

test("qualification rejects stale revisions, missing CI and failed or spoofed checks", () => {
  requireQualification(sha, sha, [run], checks);
  assert.throws(
    () => requireQualification(sha, "b".repeat(40), [run], checks),
    /stale/,
  );
  assert.throws(
    () =>
      requireQualification(
        sha,
        sha,
        [{ ...run, event: "pull_request" }],
        checks,
      ),
    /exact revision/,
  );
  for (const invalid of [
    checks.slice(0, 1),
    checks.map((c) => ({ ...c, conclusion: "failure" })),
    checks.map((c) => ({ ...c, app: { id: 42 } })),
    checks.map((c) => ({ ...c, head_sha: "b".repeat(40) })),
  ])
    assert.throws(
      () => requireQualification(sha, sha, [run], invalid),
      /Required check/,
    );
});

test("registry lookup distinguishes missing versions from failures and yanked versions", async () => {
  const request = (status, version) => async () => ({
    status,
    ok: status === 200,
    json: async () => ({ version }),
  });
  assert.equal(await registryVersion("example", "0.1.1", request(404)), null);
  await assert.rejects(
    registryVersion("example", "0.1.1", request(503)),
    /HTTP 503/,
  );
  await assert.rejects(
    registryVersion(
      "example",
      "0.1.1",
      request(200, { crate: "example", num: "0.1.1", yanked: true }),
    ),
    /yanked/,
  );
  await assert.rejects(
    registryVersion(
      "example",
      "0.1.1",
      request(200, { crate: "other", num: "0.1.1", yanked: false }),
    ),
    /Unexpected/,
  );
  assert.equal(
    (
      await registryVersion(
        "example",
        "0.1.1",
        request(200, { crate: "example", num: "0.1.1", yanked: false }),
      )
    ).num,
    "0.1.1",
  );
});

test("partial release publishes only missing crates and checks registry visibility", async () => {
  const calls = [];
  await publish(
    {
      mode: "publish",
      version: "0.1.1",
      missing: ["lapis-terminal-runtime", "tauri-plugin-lapis-terminal"],
    },
    (args) => calls.push(args),
    async () => ({}),
  );
  assert.deepEqual(calls, [
    [
      "publish",
      "--locked",
      "--registry",
      "crates-io",
      "-p",
      "lapis-terminal-runtime",
      "-p",
      "tauri-plugin-lapis-terminal",
    ],
  ]);
  await publish({ mode: "publish", missing: [] }, () =>
    assert.fail("already published"),
  );
  await assert.rejects(
    publish({ mode: "verify", missing: ["lapis-terminal-engine"] }, () =>
      assert.fail("verification published"),
    ),
    /cannot publish/,
  );
});

test("unknown upload outcomes are not retried and absent registry confirmation fails", async () => {
  const plan = {
    mode: "publish",
    version: "0.1.1",
    missing: ["lapis-terminal-engine"],
  };
  let uploads = 0;
  await assert.rejects(
    publish(plan, () => {
      uploads++;
      throw Error("network failure");
    }),
    /network failure/,
  );
  assert.equal(uploads, 1);
  await assert.rejects(
    publish(
      plan,
      () => {
        uploads++;
      },
      async () => null,
      async () => {},
    ),
    /visibility is unconfirmed/,
  );
  assert.equal(uploads, 2);
});
